# Kalakaarian — Claude Code Notes

> Source of truth for any agent or contributor working in this repo.
> Read this **first**. Then read the matching scoped guide:
> `client/CLAUDE.md` for UI work, `server/CLAUDE.md` for API work.

## Rules
- **95% Rule**: Only make code changes when 95% confident. Read all relevant files (schema, middleware, routes) first. Ask if uncertain.
- **200-line limit**: Keep every file under 200 lines. Split controllers by concern (reads vs mutations, auth vs profile vs OTP). Split services by platform (instagram vs youtube).
- **Best design patterns**: extract shared helpers (e.g. `formatInfluencer`, `createProposalDoc`, `getProfileDocs`, `applyPlatformMargin`, `checkAndGrantGoldReward`) instead of duplicating logic.
- **Never weaken security**: don't remove rate limiters, escapeRegex, mongo-sanitize, or auth guards "to make tests pass" — fix the test instead.

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

## Key Contracts (server)
- Auth middleware sets `req.user.userId` and `req.user.role` — never use `(req as any).userId`.
- Use `AuthRequest` from `middleware/auth` for any route that touches `req.user`.
- Proposal schema uses `bidAmount` (not `price`) — always use `bidAmount` in controllers and request body validators.
- DB connection: use `connectDB()` from `config/database.ts` (cached-promise pattern), not inline `mongoose.connect`.
- CORS: uses `CORS_ORIGINS` env var (comma-separated allowlist) — never `origin: '*'`.
- Rate limiting: auth routes use `express-rate-limit` via `routes/auth.ts`; OTP limiter is keyed by phone number; contact POST is keyed by IP (5/hr).
- OTP: stored hashed in MongoDB (`OtpCode` model with TTL) — never in-memory, never logged.
- **Platform margin (5%)**: stored `pricing` is the influencer's raw ask. All brand-facing reads run through `applyPlatformMargin()` from `utils/pricing.ts`. Do not multiply twice; do not write the marked-up value back to DB.
- **Influencer presence**: `isOnline` (bool) + `lastSeenAt` (Date) on `InfluencerProfile`. Updated only via `PUT /api/influencers/presence` (influencer-only).
- **Gender field**: `gender` on `InfluencerProfile`, enum `male|female|non_binary|prefer_not_to_say`. Filter via `?gender=` (whitelisted; raw input is rejected).
- **Referral Gold reward**: when a buyer purchases a Gold membership, `services/referralRewards.ts::checkAndGrantGoldReward(userId)` runs. If the buyer was referred and the referrer now has ≥10 referred users with active Gold memberships, the referrer is auto-granted a 1-year Gold membership (`paymentId: 'auto:referral-gold-reward'`, idempotent). Failures are caught and logged — they never fail the purchase.

## Controller / Service Split Map
| File | Responsibility |
|---|---|
| `controllers/authController.ts` | register, login, googleLogin |
| `controllers/otpController.ts` | sendOTP, verifyOTP, sendLoginOTP |
| `controllers/profileController.ts` | getProfile, updateProfile |
| `controllers/influencerController.ts` | influencer reads, search, presence-update target, gender filter |
| `controllers/campaignController.ts` | campaign CRUD, open-listing |
| `controllers/proposalController.ts` | reads + createProposal + submitProposal |
| `controllers/proposalActions.ts` | updateProposal, deleteProposal, respondToProposal, updateProposalStatus |
| `services/instagramService.ts` | Instagram API + mock |
| `services/youtubeService.ts` | YouTube API + mock |
| `services/socialMediaService.ts` | re-export barrel only |
| `services/referralRewards.ts` | `checkAndGrantGoldReward(userId)` (auto-grant logic) |
| `utils/pricing.ts` | `PLATFORM_MARGIN_RATE`, `applyPlatformMargin(pricing)` |
| `utils/jwt.ts` | sign/verify (uses `JWT_SECRET`) |

## Security Checklist (must hold for every PR)
- Google ID tokens: verified via `google-auth-library` `OAuth2Client.verifyIdToken()` — never just base64-decoded.
- Contact admin routes (`GET /api/contact`, `PUT /api/contact/:id/status`): guarded by `auth` + `requireAdmin`.
- Contact public POST (`POST /api/contact`): rate-limited (5 req / hour / IP).
- Regex queries: all `city`/`q` params escaped with `escapeRegex()` before use in `$regex`.
- NoSQL injection: `express-mongo-sanitize` middleware applied globally in `app.ts`.
- Pagination: `limit` clamped to max 100 (`Math.min(Number(limit) || 20, 100)`) on every list endpoint.
- `connect-social`: role-checked (`influencer` only), no `upsert: true`.
- `getInfluencerById`: populates `userId` with `name` only (no `email`).
- Gender query parameter: validated against `ALLOWED_GENDERS` whitelist before being used in a Mongo query.

## Pre-Ship Checklist
Before pushing to `main` (which auto-deploys to Vercel):
1. `cd server && npm run typecheck` → must be clean.
2. `cd client && npm run build` → must succeed.
3. `cd client && npm run lint` → fix any new errors.
4. `cd client && npm run test` → unit tests green.
5. `cd client && npm run test:e2e` → optional but recommended for auth/checkout changes.
6. Verify `.env.example` is updated if you added a new env var.
7. If you touched `InfluencerProfile`, `Membership`, or `Referral` schema fields, add a note in `docs/CHANGELOG.md`.
8. If you added a new endpoint, add it to `docs/API.md`.

## Env vars
Canonical template lives at `.env.example` (root). The server reads env at boot and **fail-fasts** on missing `JWT_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`. Vite vars must be `VITE_*` prefixed.

## When in doubt
- Read `server/src/app.ts` to see route mounting order.
- Read `server/src/types/index.ts` for canonical schema interfaces.
- Read `client/src/api/axios.ts` for the auth header pattern.
- Open `docs/PRD.docx` (or `docs/Kalakaarian_PRD_v1.docx`) for product intent.
