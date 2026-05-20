# Kalakaarian Refactor — Status & Plan

> 7-phase refactor/modularization program. This doc tracks completion vs the
> original brief and the concrete plan for what remains.
> Last updated: 2026-05-20.

## Phase status overview

| Phase | Scope | Status |
|---|---|---|
| 1 | Frontend stabilization | ✅ ~95% — bugs fixed (see below) |
| 2 | Backend modularization | 🟡 ~65% — 6 of 9 modules done |
| 3 | Event system + jobs (BullMQ/Redis) | ⬜ Not started — needs infra decision |
| 4 | Realtime platform | 🟡 Partial — campaign/workflow realtime live (Phase 1B/1C) |
| 5 | Scale + performance | ⬜ Not started |
| 6 | Security hardening | ⬜ Not started |
| 7 | Advanced marketplace systems | ⬜ Not started |

---

## Phase 1 — Frontend stabilization ✅

Shipped (commits `5224acb`, `468fb4f`, `31d9d49`, `d6b0881`):
- `client/src/lib/queryKeys.ts` — centralized query-key factory
- TanStack Query refactor + optimistic updates
- Upload engine — `lib/upload/{uploadFile,compressImage,retry,videoThumbnail}.ts`,
  `useUploader` hook, `uploadStore` (progress, retry, compression)
- Error boundary, skeleton loaders, realtime infra

Codex-review bugs fixed this session (commit `fix(phase-1)`):
- Upload cancel now aborts the presign step (AbortController per attempt)
- `onItemSuccess` fired once (removed duplicate `item.onSuccess`)
- `queryKeys` — removed unused/brittle `QueryKey` type

Remaining (minor, optional):
- Audit lazy-loading coverage on heavy routes (admin, analytics dashboards)
- Image compression is wired; confirm it runs on every upload entry point

---

## Phase 2 — Backend modularization 🟡

Target: `server/src/modules/<domain>/` each with
`routes / controller / service / repository / validators / types`.

### Done (6 modules)
| Module | Layers | Notes |
|---|---|---|
| `campaigns` | full split + zod | reference implementation |
| `influencers` | full split + `format.ts` | (= "creators" in the brief) |
| `messaging` | full split + zod | content now strictly validated |
| `notifications` | full split | |
| `wallet` | full split + zod | folded in brand-transactions controller |
| `creators` | — | satisfied by `influencers` module; rename deferred (low value) |

Cross-cutting done:
- `errorHandler` middleware wired in `app.ts` + JSON 404 fallback
- Dead code removed: `campaignController.ts`, `brandTransactionsController` shim

### Remaining Phase 2 work

**1. `auth` module** (highest priority, highest risk)
Source controllers to fold in: `authController` (register/login),
`otpController` (sendOTP/verifyOTP/sendLoginOTP), `googleAuthController`
(googleLogin/completeGoogleOnboarding), `passwordResetController`.
- ⚠️ Touches Supabase Auth sessions. CRITICAL RULE: must not break auth flows.
- ⚠️ Preserve `createAuthClient()` usage — never `signInWithPassword` on
  `adminClient` (warm-lambda session pollution, see commit `31c2342`).
- **Blocker:** zero integration tests exist for auth. Per the brief
  ("every phase must include testing"), write a Vitest + dedicated Supabase
  test-project suite covering register / login / OTP / google / reset
  *before* the refactor, then refactor against a green suite.
- Plan: `repository.ts` (profiles/brand_profiles/influencer_profiles/otp_codes/
  password_reset_tokens DAO), `service.ts` (register/login/otp/oauth/reset
  logic), controllers split by concern to honour the 200-line limit, zod
  validators replacing the `express-validator` chains in `routes/auth.ts`.

**2. `payments` module** (high risk — money + webhooks)
Source: `cartController` (298 lines — worst 200-line violator),
`invoiceController`, `razorpayService`.
- ⚠️ Razorpay order creation + webhook signature verification + 8% platform
  fee. Webhook replay/idempotency must be preserved.
- Plan: `repository.ts` (cart_items/transactions/invoices), `service.ts`
  (checkout, fee math via `utils/pricing.ts`, webhook handling), `controller.ts`,
  zod validators. Needs a checkout smoke test before merge.

**3. `admin` module** (lower risk)
Source: `adminController`, `adminUsersController`, `adminPlatformController`.
- Plan: standard full split. Guarded by `auth` + `requireAdmin` — keep guards.

**4. Standardized API responses**
- Add `utils/apiResponse.ts` — `ok(res, data)` / `fail(res, status, message)`.
- Roll out per-module without changing existing JSON shapes (additive).

**5. Module encapsulation cleanup**
- `modules/campaigns/routes.ts` imports legacy `campaignCreatorController`.
  Move `campaignCreatorController` + `workflowController` + `workflowActions`
  into the campaigns module (campaign-creators is part of the campaigns
  bounded context — no separate module needed).

---

## Phase 3 — Event system + jobs ⬜

**Decision required before starting:** Redis hosting. Vercel serverless
functions are stateless and short-lived — BullMQ workers need a persistent
process. Options:
- Upstash Redis + a separate worker (Railway / Fly / Render), or
- Supabase `pg_cron` + a queue table (no Redis; already used for platform sync).

Do not scaffold BullMQ/Redis until the host is chosen — half-built infra is
dead code (violates the brief). Once chosen:
- Internal event bus (typed `EventEmitter` wrapper) in `server/src/events/`
- Job queues: emails, notifications, invoice generation, analytics sync,
  upload post-processing, webhook retries
- Idempotency keys, retry/backoff, dead-letter logging

---

## Phase 4 — Realtime platform 🟡

Done: campaign-creator + workflow realtime subscriptions
(`useRealtimeCampaignCreator`, `useWorkflow`), polling gated on realtime
availability (commit `31d9d49`).
Remaining: realtime messaging (table is ready), realtime notifications,
live brand/creator dashboard counters, creator presence broadcast channel.

---

## Phase 5 — Scale + performance ⬜
- DB indexes audit (FTS, tier/city filters, `campaign_creators` joins)
- Pagination on every list endpoint (most done; audit admin lists)
- HTTP caching headers (some present on influencer reads)
- Media: CDN-ready Supabase image transforms, responsive variants
- Prep `pgvector` for semantic creator search (Phase 7 dependency)

## Phase 6 — Security hardening ⬜
- Upload: MIME sniffing, EXIF stripping, size caps server-side, AV-scan hook
- Audit log table + suspicious-activity heuristics
- Webhook replay protection (timestamp + nonce) — ties into Phase 3
- Rate-limit standardization (shared limiter factory)
- Session/device tracking

## Phase 7 — Advanced marketplace ⬜
- AI creator recommendation (depends on Phase 5 pgvector)
- Semantic search, campaign-fit scoring
- Fraud detection heuristics
- Escrow payment architecture + automated payouts (depends on Phase 3 jobs)
- Advanced analytics dashboard

---

## Rollback notes
- All Phase 2 module work is behavior-preserving file reorganization. Old
  route paths are unchanged; `routes/*.ts` are re-export shims.
- To roll back any module: restore the original controller file and point the
  `routes/<name>.ts` shim back at it. No DB or schema changes were made.
- No migrations were added or modified in Phases 1–2.
