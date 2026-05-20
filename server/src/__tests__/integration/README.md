# Auth integration tests

Real HTTP requests against the real Express app + a real Supabase project.
These cover the auth flows (`/api/auth/*`) that have no integration coverage —
the prerequisite for safely refactoring auth into `modules/auth/` (Phase 2).

## Opt-in by design

Integration tests are **disabled unless a dedicated Supabase test project is
configured**. They create and delete real users, so they must never run
against production. With no test project set, every test is skipped and
`npm test` stays green (unit tests still run).

## Setup

1. Create a **separate** Supabase project for testing (not prod, not staging
   that holds real data).
2. Apply the repo migrations to it (`supabase/migrations/`) so the schema
   matches — `profiles`, `brand_profiles`, `influencer_profiles`,
   `influencer_pricing`, `otp_codes`, `password_reset_tokens`.
3. Set these env vars (e.g. in `server/.env` or your shell):

   ```
   SUPABASE_TEST_URL=https://<test-project>.supabase.co
   SUPABASE_TEST_SERVICE_ROLE_KEY=<test project service role key>
   ```

   Optional — defaults are applied if unset:
   ```
   RESET_TOKEN_PEPPER=<≥32 chars>   # used by the password-reset routes
   ```

4. Run: `npm test` (from `server/`). The integration files run alongside the
   unit suite.

The runner refuses to start if `SUPABASE_TEST_URL` equals `SUPABASE_URL`
(guard against pointing at prod).

## What is covered

| File | Endpoint(s) |
|---|---|
| `auth.register.test.ts` | `POST /api/auth/register` |
| `auth.login.test.ts` | `POST /api/auth/login` |
| `auth.otp.test.ts` | `POST /api/auth/send-otp`, `/verify-otp` |
| `auth.passwordReset.test.ts` | `forgot-password`, `validate-reset-token`, `reset-password` |
| `auth.google.test.ts` | `POST /api/auth/google`, `/complete-onboarding` (guard branches) |

Hashed secrets (OTP codes, reset tokens) cannot be read back through the API,
so those cases seed `otp_codes` / `password_reset_tokens` directly via the
service-role client using the app's real hashing utilities (`helpers/db.ts`).

## Known gap

`googleLogin` happy path is not covered — a real Google ID token cannot be
minted in tests. Only its validation/guard branches are exercised. This is
tracked in `docs/REFACTOR_STATUS.md`.

## How it works

- `helpers/env.ts` — resolves test config, points the app's Supabase env at
  the test project, sets `NODE_ENV=test`.
- `helpers/server.ts` — boots the real app on an ephemeral port.
- `helpers/http.ts` — `fetch`-based request helper (no extra dependency).
- `helpers/db.ts` — service-role client, fixture helpers, teardown. Deleting
  the auth user cascades to its profile rows.
- `helpers/suite.ts` — per-file server lifecycle + skip-aware `itest`.

Auth rate limiters in `routes/auth.ts` are disabled only under `NODE_ENV=test`
so the suite can exercise the endpoints without tripping production throttles.
