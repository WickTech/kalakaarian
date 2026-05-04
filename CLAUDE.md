# Kalakaarian — Claude Code Notes

> Source of truth for any agent or contributor working in this repo.
> Read this **first**. Then read the matching scoped guide:
> `client/CLAUDE.md` for UI work, `server/CLAUDE.md` for API work.

## Rules
- **95% Rule**: Only make code changes when 95% confident. Read all relevant files (schema, middleware, routes) first. Ask if uncertain.
- **200-line limit**: Keep every file under 200 lines. Split controllers by concern (reads vs mutations, auth vs profile vs OTP). Split services by platform (instagram vs youtube).
- **Best design patterns**: extract shared helpers (e.g. `formatInfluencer`, `createProposalDoc`, `getProfileDocs`, `applyPlatformMargin`) instead of duplicating logic.
- **Never weaken security**: don't remove rate limiters, auth guards, or input validators "to make tests pass" — fix the test instead.

## Workspace Layout
This is an **npm workspaces** monorepo (`package.json` → `workspaces: [client, server, packages/models]`). Run from repo root:
```
npm run client       # vite dev server (http://localhost:5173)
npm run server       # ts-node server (NOTE: serverless-only, see server/CLAUDE.md)
npm run typecheck    # all workspaces (calls each workspace's build)
npm run lint         # all workspaces
npm run test         # all workspaces
npm run test:e2e     # client playwright suite
```

## Deployed Codebase
- **Vercel** ships only `server/src/` (per `vercel.json`) as a serverless function and `client/dist` as static assets.
- Top-level `server/{controllers,models,routes,utils}` (no `src/`) are **dead code** — do not edit.
- The server has **no `app.listen`** — it's bundled with `serverless-http`. Local dev uses `vercel dev` (see server/CLAUDE.md).

## Stack
- **Client**: React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + TanStack Query v5
- **Server**: Express 4 + TypeScript + serverless-http (Vercel)
- **Database/Auth**: Supabase (PostgreSQL + Supabase Auth + Supabase Storage)
- **Payments**: Razorpay
- **Email**: Resend
- **Monitoring**: Sentry (optional)

## Key Contracts (server)
- Auth middleware sets `req.user.userId` (Supabase UUID) and `req.user.role` — never use `(req as any).userId`.
- Use `AuthRequest` from `middleware/auth` for any route that touches `req.user`.
- Auth tokens are **Supabase Auth JWTs** — verified via `adminClient.auth.getUser(token)`. No custom JWT signing.
- DB access: use `adminClient` from `config/supabase.ts` (service role, bypasses RLS). Never use the anon key server-side.
- OTP: 6-digit code, SHA-256 hashed with phone as salt, stored in `otp_codes` Supabase table with `expires_at` + `attempts` columns. Rate-limited to 5 attempts then deleted.
- Phone OTP verifies the number only — does not create a session. User must sign in via email+password or Google after.
- Proposal schema uses `bidAmount` (not `price`) — always use `bidAmount` in controllers and request body validators.
- CORS: uses `CORS_ORIGINS` env var (comma-separated allowlist) — never `origin: '*'`.
- Rate limiting: auth routes use `express-rate-limit`; OTP limiter keyed by phone; contact POST keyed by IP (5/hr).
- **Platform margin (5%)**: stored `pricing` is the influencer's raw ask. All brand-facing reads run through `applyPlatformMargin()` from `utils/pricing.ts`. Do not multiply twice; do not write the marked-up value back to DB.
- **Platform fee (8%)**: applied server-side on cart checkout in Razorpay order creation. Do not apply client-side.
- **Influencer presence**: `isOnline` (bool) + `lastSeenAt` (Date) on `influencer_profiles`. Updated only via `PUT /api/influencers/presence`.
- **Gender field**: `gender` on `influencer_profiles`, enum `male|female|non_binary|prefer_not_to_say`. Validated against `ALLOWED_GENDERS` whitelist in controller before use in Supabase query.
- **Tier enum**: `nano | micro | macro | celeb`. No `mid`, no `mega`. `mega` is aliased to `celeb` as a backwards-compat shim in `normalizeTier()`.

## Controller / Service Split Map
| File | Responsibility |
|---|---|
| `controllers/authController.ts` | register, login, googleLogin |
| `controllers/otpController.ts` | sendOTP, verifyOTP, sendLoginOTP |
| `controllers/profileController.ts` | getProfile, updateProfile |
| `controllers/influencerController.ts` | influencer reads, search, presence update, gender/tier filters |
| `controllers/campaignController.ts` | campaign CRUD, open-listing |
| `controllers/proposalController.ts` | reads + createProposal + submitProposal |
| `controllers/proposalActions.ts` | updateProposal, deleteProposal, respondToProposal, updateProposalStatus |
| `services/instagramService.ts` | Instagram API + mock |
| `services/youtubeService.ts` | YouTube API + mock |
| `services/socialMediaService.ts` | re-export barrel only |
| `utils/pricing.ts` | `PLATFORM_MARGIN_RATE` (5%), `PLATFORM_FEE_RATE` (8%), `applyPlatformMargin(pricing)` |

## Security Checklist (must hold for every PR)
- Google ID tokens: verified via `google-auth-library` `OAuth2Client.verifyIdToken()` — never just base64-decoded.
- Contact admin routes (`GET /api/contact`, `PUT /api/contact/:id/status`): guarded by `auth` + `requireAdmin`.
- Contact public POST (`POST /api/contact`): rate-limited (5 req / hour / IP).
- Supabase queries use parameterized values — no injection risk. Do not use raw SQL string interpolation.
- Pagination: `limit` clamped to max 100 (`Math.min(Number(limit) || 20, 100)`) on every list endpoint.
- `connect-social`: role-checked (`influencer` only).
- `getInfluencerById`: selects `name` only from profiles (no `email`).
- Gender/tier query params: validated against whitelists (`ALLOWED_GENDERS`, `VALID_TIERS`) before use.

## Pre-Ship Checklist
Before pushing to `main` (which auto-deploys to Vercel):
1. `cd server && npm run typecheck` → must be clean.
2. `cd client && npm run build` → must succeed.
3. `cd client && npm run lint` → fix any new errors.
4. `cd client && npm run test` → unit tests green.
5. `cd client && npm run test:e2e` → optional but recommended for auth/checkout changes.
6. Verify `.env.example` is updated if you added a new env var.
7. If you touched `influencer_profiles`, `memberships`, or migration schema, add a note in `docs/CHANGELOG.md`.
8. If you added a new endpoint, add it to `docs/API.md`.

## Env vars
Canonical template lives at `.env.example` (root). The server **fail-fasts** on missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at boot. Vite vars must be `VITE_*` prefixed.

Required vars:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CORS_ORIGINS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_RAZORPAY_KEY_ID=
```

Optional:
```
SENTRY_DSN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
INSTAGRAM_ACCESS_TOKEN=
YOUTUBE_API_KEY=
```

## Database / Migrations
Schema lives in `supabase/migrations/`. Apply in order:
1. v2 migrations `001` through `010` (from `kalakaarian-v2/supabase/migrations/`) — base schema
2. `supabase/migrations/011_v1_extras.sql` — v1-specific tables

For schema changes, add a new numbered migration file (`012_...sql`). Never edit existing migration files.

## When in doubt
- Read `server/src/app.ts` to see route mounting order.
- Read `server/src/types/index.ts` for canonical TypeScript interfaces.
- Read `client/src/api/axios.ts` for the auth header pattern.
- Open `docs/PRD.docx` for product intent.
