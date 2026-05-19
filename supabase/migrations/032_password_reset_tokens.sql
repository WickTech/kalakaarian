-- 032_password_reset_tokens.sql
-- Forgot/Reset password support. Token plaintext NEVER stored — only SHA-256(token || pepper).
-- Service-role only (RLS deny-all). Pepper lives in env RESET_TOKEN_PEPPER.

create table if not exists password_reset_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_prt_user_id    on password_reset_tokens (user_id);
create index if not exists idx_prt_expires_at on password_reset_tokens (expires_at);

alter table password_reset_tokens enable row level security;
-- No policies = deny-all for anon + authenticated. Service role bypasses RLS.
