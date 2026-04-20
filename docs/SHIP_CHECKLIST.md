# Ship Checklist

> Run through this before every push to `main` (which auto-deploys via Vercel).
> If any step fails, fix the underlying issue — do not bypass it.

## 1. Code health
- [ ] `cd server && npm run typecheck` → no errors
- [ ] `cd client && npm run build` → builds clean
- [ ] `cd client && npm run lint` → no new errors
- [ ] `cd client && npm run test` → all green
- [ ] No file > 200 lines (split if so)

## 2. Security gates (manual eyeball)
- [ ] Any new public route is rate-limited or behind `auth`
- [ ] Any new `$regex` query passes through `escapeRegex()`
- [ ] Any new `?limit=` query is clamped via `Math.min(Number(limit) || 20, 100)`
- [ ] Any new `req.user` access uses `AuthRequest` typing — no `(req as any)`
- [ ] No raw OTP, JWT, or password logged anywhere
- [ ] No new env var read directly without being added to `.env.example`
- [ ] No CORS regression (origin allowlist is still `CORS_ORIGINS`, never `*`)

## 3. Schema / contract changes
- [ ] If you added a Mongoose field with a non-default value, write a backfill in `server/src/scripts/`
- [ ] If you changed a brand-facing pricing field, confirm `applyPlatformMargin` still wraps reads
- [ ] If you added a new enum value (tier, gender, status), update both `types/index.ts` and the schema enum
- [ ] If you added an endpoint, add a row to `README.md` and `docs/API.md`
- [ ] If you changed an interface in `lib/api.ts`, sync the matching type in `client/src/lib/api.ts`

## 4. Env & config
- [ ] `.env.example` updated for any new env var
- [ ] Vercel project env vars set in production AND preview (if needed)
- [ ] `CORS_ORIGINS` includes the production domain(s) you expect to serve

## 5. Smoke test on preview
After Vercel builds the PR preview:
- [ ] `GET /health` returns 200 `{ status: 'ok' }`
- [ ] Can register a new brand + influencer
- [ ] Can list `/api/influencers?gender=female&limit=5` and pagination works
- [ ] Can hit `/api/contact` once (200) and a 6th time within an hour returns 429
- [ ] Influencer pricing in the brand-facing card view shows the 5%-marked-up value
- [ ] Membership purchase (Gold) triggers no error in Vercel function logs

## 6. Release notes
- [ ] Add a one-line entry to `docs/CHANGELOG.md` describing user-visible changes
- [ ] If the change touches privacy, billing, or account state — flag it explicitly so it surfaces in support

## 7. Post-merge
- [ ] Watch `vercel.com` deploy logs for the first cold-start error
- [ ] Tail Vercel function logs for ~5 min after deploy
- [ ] Confirm the production smoke tests above
