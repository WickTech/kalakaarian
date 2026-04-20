# Kalakaarian — Gemini CLI Context

> Read this before making changes. For UI work also read `client/GEMINI.md`; for API work read `server/GEMINI.md`.

## What this project is
D2C influencer marketplace. npm workspaces monorepo: `client` (React + Vite + Tailwind + shadcn/ui), `server` (Express serverless on Vercel), `packages/models` (shared Mongoose types).

## Rules
- **95% Rule**: read all relevant files before changing anything. If uncertain, ask.
- **200-line limit**: every file must stay under 200 lines. Split by concern.
- **Never weaken security**: rate limiters, escapeRegex, mongo-sanitize, auth guards are non-negotiable.
- **No duplication**: reuse `formatInfluencer`, `applyPlatformMargin`, `checkAndGrantGoldReward`, `connectDB`.

## Key server contracts
- `req.user.userId` / `req.user.role` set by auth middleware — use `AuthRequest`, never `(req as any).userId`
- Proposals use `bidAmount` (not `price`)
- Brand-facing pricing: always run through `applyPlatformMargin()` from `server/src/utils/pricing.ts`
- DB: `connectDB()` from `server/src/config/database.ts` (cached promise, safe on cold starts)
- CORS: `CORS_ORIGINS` env var — never `origin: '*'`
- OTP: hashed in MongoDB via `OtpCode` model with TTL — never in-memory, never logged

## Deployed layout
- Only `server/src/` is built and deployed (see `server/vercel.json`)
- `server/{controllers,models,routes,utils}` without `src/` are dead code — do not edit
- Server has **no `app.listen`** — it uses `serverless-http`. Use `vercel dev` for local HTTP

## Security checklist (must hold)
- Google ID tokens: verify via `OAuth2Client.verifyIdToken()`, never base64-decode
- Regex params: escape with `escapeRegex()` before `$regex`
- NoSQL injection: `express-mongo-sanitize` applied globally
- Pagination: `Math.min(Number(limit) || 20, 100)` on all list endpoints
- Gender param: validated against `ALLOWED_GENDERS` whitelist

## Pre-ship commands (run from repo root)
```
npm run typecheck    # tsc across all workspaces
npm run lint         # eslint/tsc across all workspaces
npm run test         # vitest across all workspaces
cd client && npm run build
```

## When in doubt
- Route order: `server/src/app.ts`
- Schema interfaces: `server/src/types/index.ts`
- Auth header pattern: `client/src/api/axios.ts`
