-- Phase 3: durable background-job queue (Supabase pg_cron + Postgres, no Redis).
--
-- A `jobs` table is the queue. The server worker endpoint
-- POST /api/internal/jobs/process claims a batch of due jobs via claim_jobs(),
-- runs their handlers, and marks them completed / retried / failed.
--
-- PREREQUISITES (run once in the Supabase SQL editor):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- Before applying: replace <SERVER_URL> (no trailing slash) and <CRON_SECRET>
-- (= process.env.CRON_SECRET configured in Vercel).

create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts        int not null default 0,
  max_attempts    int not null default 5,
  run_after       timestamptz not null default now(),
  idempotency_key text,
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- Due-job lookup.
create index if not exists jobs_due_idx on jobs (run_after) where status = 'pending';
-- Stale-processing reclaim lookup.
create index if not exists jobs_processing_idx on jobs (updated_at) where status = 'processing';
-- Idempotency: at most one row per key (NULL keys are unconstrained).
create unique index if not exists jobs_idempotency_idx
  on jobs (idempotency_key) where idempotency_key is not null;

-- Service-role only — the server uses the service key, which bypasses RLS.
alter table jobs enable row level security;

-- Atomically claims up to p_limit due jobs. Picks pending jobs whose run_after
-- has passed, plus processing jobs stuck >10 min (crash recovery). FOR UPDATE
-- SKIP LOCKED makes concurrent workers safe.
create or replace function claim_jobs(p_limit int)
returns setof jobs
language sql
as $$
  update jobs
  set status = 'processing', attempts = attempts + 1, updated_at = now()
  where id in (
    select id from jobs
    where (status = 'pending' and run_after <= now())
       or (status = 'processing' and updated_at < now() - interval '10 minutes')
    order by run_after
    limit p_limit
    for update skip locked
  )
  returning *;
$$;

-- Schedule the worker every minute.
DO $$
BEGIN
  PERFORM cron.unschedule('process-jobs')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-jobs');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'process-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := '<SERVER_URL>/api/internal/jobs/process',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To verify:
--   SELECT * FROM cron.job WHERE jobname = 'process-jobs';
--   SELECT status, count(*) FROM jobs GROUP BY status;
