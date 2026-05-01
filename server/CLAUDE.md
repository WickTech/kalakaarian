# Kalakaarian Server — Claude Code Notes

> Backend (Express + TypeScript + Mongoose, deployed as a Vercel serverless function).
> Read root `../CLAUDE.md` first for repo-wide rules.

## What's deployed
Per `vercel.json`, only **`server/src/`** is built. The legacy `server/{controllers,models,routes,utils}` (no `src/`) folders are dead code — leave them alone or you'll have two sources of truth.

## No `app.listen` — serverless-only
`server/src/app.ts` exports `handler = serverless(app)` (via `serverless-http`) and **does not call `app.listen`**. That means:
- `npm run dev` (`ts-node src/app.ts`) **does not start an HTTP server**. It just imports the module.
- For local dev with HTTP, run `vercel dev` from the **repo root** (it reads `vercel.json` and routes everything to `server/src/app.ts`).
- Or, for fast iteration on a single controller, write a focused unit test against the exported function.

If you ever need a local listener for debugging, add a guarded block at the bottom of `app.ts`:
```ts
if (process.env.LOCAL_LISTEN === '1') {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`local: http://localhost:${port}`));
}
```
…and run with `LOCAL_LISTEN=1 npm run dev`. Don't commit a default-on listener — Vercel will reject it.

## Environment (fail-fast)
At boot, `app.ts` throws if any of these are missing:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional but commonly needed:
- `CORS_ORIGINS` (comma-separated; without it, all browser origins are blocked)
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (OTP flow falls back to mock if absent)
- `INSTAGRAM_ACCESS_TOKEN`, `YOUTUBE_API_KEY` (social services fall back to mock if absent)

Canonical template: repo-root `.env.example`. Update it when adding a new env var.

## Routing
Mounted in `app.ts`. The same prefix can host multiple route files (campaigns mounts three). Order matters when two files own overlapping paths.

| Prefix | Files |
|---|---|
| `/api/auth` | `routes/auth.ts` |
| `/api/influencers` | `routes/influencers.ts` |
| `/api/campaigns` | `routes/campaigns.ts`, `routes/campaignFiles.ts`, `routes/campaignWorkflow.ts` |
| `/api/proposals` | `routes/proposals.ts` |
| `/api/cart` | `routes/cart.ts` |
| `/api/messages` | `routes/messages.ts` |
| `/api/analytics` | `routes/analytics.ts` |
| `/api/membership` | `routes/membership.ts` |
| `/api/videos` | `routes/videos.ts` |
| `/api/referrals` | `routes/referrals.ts` |
| `/api/notifications` | `routes/notifications.ts` |
| `/api/whatsapp` | `routes/whatsapp.ts` |
| `/api/social` | `routes/socialStats.ts` |
| `/api/contact` | `routes/contact.ts` |
| `/health` | inline in `app.ts` (no DB) |

## Patterns to follow
- **`AuthRequest`** for any handler that touches `req.user`. Read `userId` and `role` off `req.user`, never off the body.
- **`escapeRegex(str)`** before any user-supplied value enters a `$regex` query.
- **`Math.min(Number(limit) || 20, 100)`** for any list endpoint that accepts `?limit=`.
- **`connectDB()`** from `config/database.ts` — cached promise, safe to call on every cold start.
- **Rate limiters** declared at the top of the route file, cast as `as unknown as RequestHandler` (TypeScript version mismatch with `@types/express-serve-static-core` makes the direct cast fail).
- **OTP** stored hashed (`bcrypt`) with TTL via `OtpCode` model — never log raw OTP, never store in memory.
- **Google ID tokens** verified with `OAuth2Client.verifyIdToken()` — never base64-decode and trust.
- **Brand-facing pricing** runs through `utils/pricing.ts::applyPlatformMargin()`. Stored values stay raw.
- **Whitelist enums** (e.g. `ALLOWED_GENDERS` in `influencerController.ts`) before passing query params into Mongo.

## Side-effect helpers
- `services/referralRewards.ts::checkAndGrantGoldReward(buyerUserId)` — call after a Gold-tier membership purchase. Idempotent. Wrap the call in try/catch so a reward error never fails the parent request.
- `utils/pricing.ts::applyPlatformMargin(pricing)` — pure function. Use in any read-formatter that exposes pricing to brands.

## Adding a new endpoint
1. Add or extend the relevant model in `models/`.
2. Add the TypeScript interface to `types/index.ts`.
3. Add the controller function (≤ 200 lines per file; split if needed).
4. Wire it in the route file with the right middleware (`auth`, `requireAdmin`, validators, rate-limiter).
5. Add it to `app.ts` only if introducing a new prefix.
6. Run `npm run typecheck`.
7. Document in `docs/API.md` and add a row to root `CLAUDE.md` if it introduces a new contract.

## Migrations
Mongoose has no migration runner. For schema changes:
- Adding a field with a default → safe, no migration needed.
- Renaming a field or changing an enum → write a one-off script in `scripts/` (mirrors `scripts/seed.ts`) and run it manually before/after deploy.
- Document any data backfill in `docs/CHANGELOG.md`.

## Testing
There's no server test suite yet. When adding one, prefer Vitest with `mongodb-memory-server` for integration tests, and keep them in `server/src/__tests__/`.

## Common mistakes to avoid
- ❌ Calling `app.listen` in `app.ts` — Vercel will fail to bundle.
- ❌ Using `process.env.CORS_ORIGIN` (singular). The app reads `CORS_ORIGINS` (plural).
- ❌ Returning raw `pricing` from a brand-facing endpoint without `applyPlatformMargin`.
- ❌ Forgetting to populate `userId` with `'name'` only (`'name email'` leaks PII).
- ❌ `findOneAndUpdate(..., { upsert: true })` on routes that should fail loudly when the profile is missing (e.g. `connect-social`).
- ❌ Adding a new env var without updating root `.env.example`.
