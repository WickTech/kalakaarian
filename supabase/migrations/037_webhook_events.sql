-- Phase 6: webhook replay protection.
--
-- A valid HMAC signature never expires, so a captured webhook request can be
-- replayed indefinitely. This table records every processed provider event id;
-- the payments webhook handler inserts the id before acting and treats a
-- unique-violation as a replay (acknowledged, not re-processed).

create table if not exists webhook_events (
  event_id    text primary key,
  provider    text not null default 'razorpay',
  received_at timestamptz not null default now()
);

-- Service-role only (the server uses the service key, which bypasses RLS).
alter table webhook_events enable row level security;
