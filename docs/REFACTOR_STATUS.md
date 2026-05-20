# Kalakaarian Refactor — Status & Plan

> 7-phase refactor/modularization program. This doc tracks completion vs the
> original brief and the concrete plan for what remains.
> Last updated: 2026-05-20.

## Phase status overview

| Phase | Scope | Status |
|---|---|---|
| 1 | Frontend stabilization | ✅ ~95% — bugs fixed (see below) |
| 2 | Backend modularization | 🟢 ~95% — all 9 modules done; 2 cross-cutting items left |
| 3 | Event system + jobs (pg_cron queue) | 🟡 Infra done — handler migration ongoing |
| 4 | Realtime platform | 🟢 ~90% — messaging/notifications/presence/campaign live |
| 5 | Scale + performance | ⬜ Not started |
| 6 | Security hardening | 🟡 Webhook replay + rate-limit + timing-safe done |
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

### Done (all 9 modules)
| Module | Layers | Notes |
|---|---|---|
| `campaigns` | full split + zod | reference implementation |
| `influencers` | full split + `format.ts` | (= "creators" in the brief) |
| `messaging` | full split + zod | content now strictly validated |
| `notifications` | full split | |
| `wallet` | full split + zod | folded in brand-transactions controller |
| `auth` | split by concern | register/login, OTP, OAuth, password-reset |
| `admin` | full split | audit logging in repo; super-admin guarded |
| `payments` | split by concern | cart/checkout/webhook + invoices; `paymentFinalizer` |
| `creators` | — | satisfied by `influencers` module; rename deferred (low value) |

`auth` module layout: per-concern `repository`/`service`/`controller` trios
(auth, otp, oauth, passwordReset) under the 200-line limit, plus shared
`types.ts`, `validators.ts`, `routes.ts`. Behavior-preserving — old route
paths unchanged, `routes/auth.ts` is now a re-export shim. Integration suite
(`src/__tests__/integration/`) is the safety net.

Cross-cutting done:
- `errorHandler` middleware wired in `app.ts` + JSON 404 fallback
- Dead code removed: `campaignController.ts`, `brandTransactionsController`
  shim, the 4 old auth controllers, the 3 old admin controllers, the 2 old
  cart/invoice controllers

### Remaining Phase 2 work

⚠️ **`payments` verification owed** — the module is a behavior-preserving
extraction (typecheck clean) but checkout + the Razorpay webhook have no
automated test. Run a live checkout smoke test (paid path + free-checkout
path + webhook idempotency) before relying on it in production.

**1. Standardized API responses**
- Add `utils/apiResponse.ts` — `ok(res, data)` / `fail(res, status, message)`.
- Roll out per-module without changing existing JSON shapes (additive).

**2. Module encapsulation cleanup**
- `modules/campaigns/routes.ts` imports legacy `campaignCreatorController`.
  Move `campaignCreatorController` + `workflowController` + `workflowActions`
  into the campaigns module (campaign-creators is part of the campaigns
  bounded context — no separate module needed).

---

## Phase 3 — Event system + jobs 🟡

**Approach chosen:** Supabase `pg_cron` + a Postgres queue table — no Redis,
no BullMQ. Fits the Vercel serverless model (the worker is an HTTP endpoint,
not a persistent process) and reuses the pg_cron pattern already in
migration `023`.

### Infra done
- **Migration `035_job_queue.sql`** — `jobs` table, `claim_jobs()` RPC
  (`FOR UPDATE SKIP LOCKED` + 10-min stale-`processing` reclaim), pg_cron
  schedule hitting the worker every minute.
- **`server/src/jobs/`** — `queue.ts` (`enqueueJob`), `repository.ts` (DAO),
  `worker.ts` (`processDueJobs` — claim batch, run, retry/fail),
  `handlers.ts` (type→handler registry), `backoff.ts` (1m→1h exp. backoff),
  `controller.ts` (worker endpoint).
- **Worker endpoint** — `POST /api/internal/jobs/process`, cron-secret guarded.
- **`server/src/events/`** — typed domain-event `bus` + `listeners.ts`
  wiring events → job enqueues.
- Idempotency (unique `idempotency_key`), retry/backoff, crash recovery
  (stale-`processing` reclaim), and failure logging are all in place.
- **Reference migration:** `user.registered` event → `email.welcome` job
  (deduped by `idempotency_key`). Replaces the old fire-and-forget welcome
  email in `authService`.
- Unit test: `jobs/__tests__/backoff.test.ts`.

### Remaining
- **Apply `035` to prod** (manual — replace `<SERVER_URL>` / `<CRON_SECRET>`,
  enable `pg_cron` + `pg_net`). Same manual step as migration `023`.
- Migrate more async tasks to job handlers: notifications, invoice generation,
  analytics sync, upload post-processing, webhook retries. The infra +
  registry make each a small, isolated addition. **Keep latency-sensitive
  emails (OTP, password-reset) synchronous** — the worker runs once a minute.
- Optional: a `jobs.test.ts` integration test (needs `035` on the test
  project) covering enqueue → process → retry.

---

## Phase 4 — Realtime platform 🟢 ~90%

Done:
- Campaign-creator + workflow realtime (`useRealtimeCampaignCreator`),
  creator presence (`useRealtimePresence`), polling gated on realtime
  availability (commit `31d9d49`).
- **Realtime messaging + notifications** — `useRealtimeMessaging.ts`
  (`useRealtimeConversationList`, `useRealtimeConversationMessages`,
  `useRealtimeNotifications`). `Messages.tsx` 5s poll and `NotificationBell`
  30s poll are now gated on `hasRealtime()` — realtime is the primary path,
  polling only the no-env fallback.
- **Migration `036`** — adds `messages` / `notifications` / `conversations`
  to the `supabase_realtime` publication, sets `REPLICA IDENTITY FULL`, and
  enables SELECT-only RLS so a session receives only its own rows. ⚠️ must
  be applied before realtime messaging works in prod (manual, like `035`).

Remaining: live brand/creator dashboard counters (campaign/earnings tiles
still load once per mount). Lower value — defer or wire on demand.

---

## Phase 5 — Scale + performance ⬜
- DB indexes audit (FTS, tier/city filters, `campaign_creators` joins)
- Pagination on every list endpoint (most done; audit admin lists)
- HTTP caching headers (some present on influencer reads)
- Media: CDN-ready Supabase image transforms, responsive variants
- Prep `pgvector` for semantic creator search (Phase 7 dependency)

## Phase 6 — Security hardening 🟡

Done:
- **Webhook replay protection** — migration `037_webhook_events.sql` +
  `recordWebhookEvent()`. The Razorpay webhook records each provider event
  id (`x-razorpay-event-id`) and acknowledges replays without re-processing.
  Fails open if the table is missing — the `cart_orders.status` check stays
  the primary idempotency guard.
- **Timing-safe signatures** — `verifySignature` + `verifyWebhookSignature`
  now use `crypto.timingSafeEqual` instead of `===`.
- **Rate-limit standardization** — `middleware/rateLimit.ts`
  (`createRateLimiter`). All 7 limiter sites (auth, upload, platforms,
  feedback, contact, account, campaigns) use it — one place for the
  test-mode gate + the type cast.
- Already in place from earlier work: upload MIME allowlist + per-purpose
  check (`routes/upload.ts`), realtime RLS (migration `036`).

Remaining:
- EXIF stripping on image uploads (best as a job — Phase 3 handler).
- Upload AV-scan hook (needs an external scanner integration).
- Security audit-log table + suspicious-activity heuristics (failed logins,
  unusual access). `admin_audit_logs` already covers admin actions.
- Session / device tracking.

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
