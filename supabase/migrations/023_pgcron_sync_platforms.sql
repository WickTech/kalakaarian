-- Daily creator-platform analytics sync via Supabase pg_cron (free tier).
--
-- PREREQUISITES (run once in Supabase dashboard SQL editor):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- Before applying this migration:
--   1. Replace <SERVER_URL> with the deployed server URL (no trailing slash).
--   2. Replace <CRON_SECRET> with the value of process.env.CRON_SECRET
--      configured in Vercel.
--
-- The cron hits POST /api/internal/cron/sync-platforms which iterates over
-- creator_platform_accounts (deleted_at IS NULL) and fetches fresh metrics.

DO $$
BEGIN
  -- Unschedule any prior version so re-running this migration is idempotent.
  PERFORM cron.unschedule('sync-platforms-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-platforms-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'sync-platforms-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := '<SERVER_URL>/api/internal/cron/sync-platforms',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To verify:
--   SELECT * FROM cron.job WHERE jobname = 'sync-platforms-daily';
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
