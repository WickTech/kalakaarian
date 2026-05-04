# Kalakaarian Server — Claude Code Notes

> Backend (Express + TypeScript + Supabase, deployed as a Vercel serverless function).
> Read root `../CLAUDE.md` first for repo-wide rules.

## What's deployed
Per `vercel.json`, only **`server/src/`** is built. The legacy `server/{controllers,models,routes,utils}` (no `src/`) folders are dead code — leave them alone.

## No `app.listen` — serverless-only
`server/src/app.ts` exports the Express app (via `serverless-http`) and **does not call `app.listen`**. That means:
- `npm run dev` (`ts-node src/app.ts`) **does not start an HTTP server**. It just imports the module.
- For local dev with HTTP, run `vercel dev` from the **repo root** (reads `vercel.json` and routes to `server/src/app.ts`).

If you need a local listener for debugging:
```ts
if (process.env.LOCAL_LISTEN === '1') {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`local: http://localhost:${port}`));
}
```
Run with `LOCAL_LISTEN=1 npm run dev`. Don't commit a default-on listener.

## Environment (fail-fast)
At boot, `app.ts` throws if either of these are missing:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional but commonly needed:
- `CORS_ORIGINS` (comma-separated; without it, only hardcoded prod/dev origins are allowed)
- `WHATSAPP_*` vars (OTP flow falls back to mock if absent)
- `INSTAGRAM_ACCESS_TOKEN`, `YOUTUBE_API_KEY` (social services fall back to mock if absent)

Canonical template: repo-root `.env.example`. Update it when adding a new env var.

## Routing
Mounted in `app.ts`. Order matters when two files own overlapping paths.

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
| `/api/notifications` | `routes/notifications.ts` |
| `/api/whatsapp` | `routes/whatsapp.ts` |
| `/api/social` | `routes/socialStats.ts` |
| `/api/contact` | `routes/contact.ts` |
| `/api/upload` | `routes/upload.ts` |
| `/api/feed` | `routes/feed.ts` |
| `/health` | inline in `app.ts` (no DB) |

## Patterns to follow
- **`AuthRequest`** for any handler that touches `req.user`. Read `userId` and `role` off `req.user`, never off the body.
- **`adminClient`** from `config/supabase.ts` for all DB access — service role, bypasses RLS.
- **`Math.min(Number(limit) || 20, 100)`** for any list endpoint that accepts `?limit=`.
- **Rate limiters** declared at the top of the route file, cast as `as unknown as RequestHandler`.
- **OTP** stored SHA-256 hashed (with phone as salt) in `otp_codes` Supabase table. Never log raw OTP. Never store in memory. 5-attempt limit enforced in `verifyOTP`.
- **Google ID tokens** verified with `OAuth2Client.verifyIdToken()` — never base64-decode and trust.
- **Brand-facing pricing** runs through `utils/pricing.ts::applyPlatformMargin()`. Stored values stay raw.
- **Tier/gender filters** validated against whitelists (`VALID_TIERS`, `ALLOWED_GENDERS`) before passing to Supabase query.
- **Supabase queries** use the query builder (parameterized) — never use raw SQL string interpolation.

## Adding a new endpoint
1. Add the TypeScript interface to `types/index.ts`.
2. Add the controller function (≤ 200 lines per file; split if needed).
3. Wire it in the route file with the right middleware (`auth`, `requireAdmin`, validators, rate-limiter).
4. Add it to `app.ts` only if introducing a new prefix.
5. Run `npm run typecheck`.
6. Document in `docs/API.md` and add a row to root `CLAUDE.md` if it introduces a new contract.

## Migrations
Schema lives in `supabase/migrations/`. Rules:
- Always add a new numbered file (`012_...sql`, `013_...sql`, etc.). Never edit existing files.
- Adding a nullable column or a new table → safe to apply without downtime.
- Renaming a column or changing an enum → coordinate with a deploy to avoid broken reads during rollout.
- Document any backfill in `docs/CHANGELOG.md`.

## Testing
No server test suite yet. When adding one, use Vitest + a dedicated Supabase test project (not a mock). Keep tests in `server/src/__tests__/`.

## Common mistakes to avoid
- ❌ Calling `app.listen` in `app.ts` — Vercel will fail to bundle.
- ❌ Using `process.env.CORS_ORIGIN` (singular). The app reads `CORS_ORIGINS` (plural).
- ❌ Returning raw `pricing` from a brand-facing endpoint without `applyPlatformMargin`.
- ❌ Selecting `email` from `profiles` in any endpoint that isn't explicitly admin-only.
- ❌ Adding a new env var without updating root `.env.example`.
- ❌ Using the anon key server-side — always use `SUPABASE_SERVICE_ROLE_KEY` via `adminClient`.
- ❌ Raw SQL string interpolation — always use the Supabase query builder.
