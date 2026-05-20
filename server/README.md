# Kalakaarian — Server

Express 4 + TypeScript backend, deployed as a Vercel serverless function via `serverless-http`.

> **Only `server/src/` is deployed.** The legacy `server/{controllers,models,routes,utils}` (no `src/`) are dead code from the original MongoDB version — do not edit.

## Stack

| Tool | Purpose |
|---|---|
| Express 4 + TypeScript | HTTP framework |
| serverless-http | Vercel serverless adapter — no `app.listen()` |
| Supabase adminClient | PostgreSQL + Auth (service role, bypasses RLS) |
| Razorpay | Payments |
| Resend | Transactional email |
| pdfkit | Invoice PDF generation |

## Local Dev

The server has no `app.listen` — run via Vercel CLI from the repo root:

```bash
vercel dev          # starts API on port 4000 + client on 5173
```

For debugging with a direct HTTP listener:
```bash
LOCAL_LISTEN=1 npm run dev   # from server/
```

## Structure

```
server/src/
├── config/         # supabase.ts — adminClient (service role)
├── controllers/    # route handlers, ≤200 lines each
├── middleware/     # auth.ts (JWT verify), requireAdmin.ts, validate.ts
├── modules/        # domain modules (influencers, campaigns, notifications, …)
│   └── influencers/
│       ├── repository.ts   # all Supabase queries for influencers domain
│       ├── service.ts      # business logic
│       ├── controller.ts   # Express handlers
│       └── format.ts       # row → API-shape mapper
├── routes/         # route files (one per domain prefix)
├── services/       # platform sync, Instagram, YouTube, Razorpay, Resend
├── types/          # AuthRequest, shared interfaces
├── utils/          # pricing.ts, tokenCrypto.ts, oauthState.ts
└── app.ts          # serverless entrypoint — mounts all routes
```

## Key Contracts

| Contract | Detail |
|---|---|
| `req.user.userId` + `req.user.role` | Set by auth middleware from Supabase JWT — use `AuthRequest` type |
| `adminClient` | Service role, bypasses RLS — only for server-side reads |
| 5% platform margin | `applyPlatformMargin()` from `utils/pricing.ts` — run on every brand-facing influencer read |
| 8% platform fee | Applied at Razorpay order creation only — never client-side |
| Pagination `limit` | Always `Math.min(Number(limit) || 20, 100)` |
| Token storage | AES-256-GCM via `encryptToken()`/`decryptToken()` in `utils/tokenCrypto.ts` — never store plaintext |
| OAuth CSRF state | `buildOAuthState()`/`verifyOAuthState()` from `utils/oauthState.ts` for both IG + YT |
| Cron secret | Returns 404 (not 401) on bad `X-Cron-Secret` to avoid endpoint discovery |
| Gender/tier filters | Validated against `ALLOWED_GENDERS` / `VALID_TIERS` whitelists before Supabase query |

## Search Architecture

Marketplace search (`GET /api/influencers?name=term`) uses a three-step ID resolution:

1. Query `profiles` table — `name ILIKE %term%` OR `username ILIKE %term%`
2. Query `influencer_profiles` — `city ILIKE %term%`
3. Match term against 25 known niche names (case-insensitive) → `overlaps('niches', matches)`

Union all matched IDs → `.in('id', [...])` on the main query. This avoids a PostgREST bug where embedded-resource ILIKE filters nullify the join data instead of filtering parent rows.

## Adding an Endpoint

1. Add TypeScript interface to `types/index.ts`
2. Add controller function (≤200 lines; split by concern if needed)
3. Wire in route file with correct middleware (`auth`, `requireAdmin`, validators, rate limiter)
4. Add to `app.ts` only if new prefix
5. `npm run typecheck` — must be clean
6. Document in `docs/API.md` and update root `CLAUDE.md` if new contract introduced

## Migrations

Schema in `supabase/migrations/`. Always add a new numbered file — never edit existing ones. Applied migrations: 011 → 031.
