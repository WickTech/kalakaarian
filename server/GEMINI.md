# Kalakaarian Server — Gemini CLI Context

> Read root `GEMINI.md` first for repo-wide rules.

## Deployment model
Express app exported as `handler = serverless(app)` via `serverless-http`. No `app.listen`. Local HTTP: run `vercel dev` from repo root. Only `server/src/` is deployed.

## Route prefixes (all in server/src/app.ts)
`/api/auth` `/api/influencers` `/api/campaigns` `/api/proposals` `/api/cart` `/api/messages` `/api/analytics` `/api/membership` `/api/videos` `/api/referrals` `/api/notifications` `/api/whatsapp` `/api/social` `/api/contact` `/health`

## Controller split
| File | Responsibility |
|---|---|
| `authController.ts` | register, login, googleLogin |
| `otpController.ts` | sendOTP, verifyOTP, sendLoginOTP |
| `profileController.ts` | getProfile, updateProfile |
| `influencerController.ts` | influencer reads, search, presence, gender filter |
| `campaignController.ts` | campaign CRUD, open-listing |
| `proposalController.ts` | reads + createProposal + submitProposal |
| `proposalActions.ts` | updateProposal, deleteProposal, respondToProposal, updateProposalStatus |

## Patterns to always follow
- `AuthRequest` for any handler touching `req.user`
- `escapeRegex(str)` before any user input enters `$regex`
- `Math.min(Number(limit) || 20, 100)` on every list endpoint
- `connectDB()` from `config/database.ts` on every handler (cached, safe on cold start)
- `applyPlatformMargin(pricing)` on every brand-facing pricing read
- Rate limiters cast as `as unknown as RequestHandler` (TS version mismatch workaround)

## Env fail-fast
Server throws at boot if missing: `JWT_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`

## Adding an endpoint
1. Model in `models/`, interface in `types/index.ts`
2. Controller (≤200 lines), route file with auth/validation/rate-limiter
3. Mount prefix in `app.ts` only if new prefix needed
4. `npm run typecheck`, document in `docs/API.md`
