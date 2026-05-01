# Kalakaarian — Pre-Launch Audit

> Generated 2026-04-25. Author: Claude (PM + Tech Architect). Target launch: 2026-05-01. User test: 2026-04-27.

## Executive summary

The codebase is **structurally sound** — clean monorepo, well-scoped controllers/services, strong baseline security (mongo-sanitize, escapeRegex, rate limiters, admin guards, hashed OTPs). It is **not yet launch-ready** for paid use. Three P0 bugs allow security or revenue exploits, and several P1 items leave the marketplace flow incomplete. All P0 + P1 fixes can land before 2026-05-01 if executed against the day-by-day plan in `LAUNCH_PLAN.md`.

| Priority | Count | Bucket | Land by |
|---|---|---|---|
| P0 | 5 | Block launch — security / revenue / data-loss | 2026-04-27 (before user test) |
| P1 | 11 | Must-fix before public launch | 2026-04-30 |
| P2 | 8 | Should-have, not blocking | Post-launch sprint 1 |
| P3 | 12 | Tech debt / v2 migration items | v2 |

---

## P0 — block launch

### P0-1 OTP brute-force: `attempts` counter is dead code
**File:** `server/src/controllers/otpController.ts:47-91`
The `OtpCode` model carries an `attempts` field, initialized to `0` on send (line 27). `verifyOTP` never increments it and never locks the record. Within the 10-minute TTL an attacker can call `POST /api/auth/verify-otp` indefinitely (the rate limiter on `routes/auth.ts` is keyed by phone for *send* only, not *verify*). 6-digit OTP = 1M combinations; an attacker can realistically try 100+ codes/sec.
**Fix:** atomically `findOneAndUpdate({phone}, {$inc: {attempts: 1}}, {new: true})`; if `attempts >= 5` delete the record and return 429. Add an `express-rate-limit` keyed by phone (10/15min) on the verify route.

### P0-2 Membership double-activation / extension exploit
**Files:** `server/src/routes/membership.ts:59-70` (purchase) and `:136-147` (webhook)
Both `/purchase` and `/webhook` call `Membership.findOneAndUpdate({...}, {endDate: now+30d}, {upsert:true})`. Razorpay always fires the webhook even after the client confirms — so every successful payment hits the DB twice and **resets** `endDate` twice. A user paying once gets ~60 days. Replay of the webhook (Razorpay retries on non-2xx) extends it further.
**Fix:** make activation idempotent on `paymentId`. New schema: `Membership.paymentIds: string[]` unique. Activation logic:
```ts
if (membership.paymentIds.includes(paymentId)) return;  // already processed
membership.endDate = max(membership.endDate, now) + 30d;  // extend, don't reset
membership.paymentIds.push(paymentId);
```
Make `/purchase` only verify+respond, and let `/webhook` do the activation. Or vice versa. Don't let both write.

### P0-3 Expired memberships still return as active
**File:** `server/src/routes/membership.ts:91-99`
`GET /status` returns the `Membership` document if it exists, ignoring `endDate`. A Gold membership that expired 6 months ago is still served as Gold to the client, gating premium features.
**Fix:** in the controller, if `membership.endDate < new Date()` return `{ tier: 'regular' }`. Backfill: schedule a daily cron (Vercel cron or a one-off task) to demote expired memberships, OR compute live (cheaper, no cron).

### P0-4 No spam/harassment guard on direct messages
**File:** `server/src/routes/messages.ts:9-50`
`POST /api/messages/send` lets any authenticated user message any other user with no relationship check. `receiverId` existence is not verified. At launch this lets any signed-up user spam every influencer in the directory.
**Fix:**
- Verify `User.exists({_id: receiverId})`.
- Require either (a) an existing `Conversation` between the two, or (b) a `Proposal` linking them, or (c) the brand owns a `Campaign` the influencer applied to. First-message-only check; reuses cheap indexed lookups.
- Add per-sender rate limit: 30 messages / 5 min.

### P0-5 No automated tests on server
**Evidence:** `server/` has no test runner configured; `npm test` is a no-op there. Client has 1 example unit + 1 Playwright spec.
A serverless API with payments, OTP, auth, and membership going live without smoke tests is a roll-the-dice deploy.
**Fix:** before user test on 2026-04-27, ship a minimum supertest suite: auth happy-path, OTP send+verify, campaign create, proposal submit, membership purchase signature verify, webhook signature reject. Target: 20 tests, run on every push, block deploy on red. See `FEATURE_SPECS.md → Smoke Tests`.

---

## P1 — must-fix before public launch

### P1-1 PostHog never initialized
`posthog-js` is in `client/package.json` but no `posthog.init()` call exists. We have zero product analytics today.
**Fix:** init in `client/src/main.tsx` with env-gated `VITE_POSTHOG_KEY`. Track the event spec in `METRICS.md`.

### P1-2 No staging / preview environment
All pushes to `main` deploy straight to prod via Vercel. There is no staging URL for the user-test cohort.
**Fix:** create a `staging` branch + Vercel preview alias `staging.kalakaarian.com`. Run user-test cohort against staging on 2026-04-27 with a separate Mongo DB.

### P1-3 No CI on pull requests
`.github/workflows/` is empty. `npm run typecheck` / `lint` / `test` only run if a human runs them.
**Fix:** add `.github/workflows/ci.yml` running typecheck, lint, test on PR. Wire required-checks on `main`.

### P1-4 Auth: no refresh token, no logout-revoke
Single long-lived JWT in localStorage. Stolen token = persistent access until expiry. No way to invalidate.
**Fix (MVP-cheap):** keep single JWT but cut expiry to 7 days; add `User.tokenVersion` claim, increment on logout/password-change; verify `tokenVersion` in middleware. Refresh tokens deferred to v2.

### P1-5 Razorpay: no payment audit log
`Transaction` model exists but isn't written to from membership flow. We have no off-DB record of who paid what.
**Fix:** insert a `Transaction` row in both purchase and webhook paths (idempotent on `paymentId`). Required for support, refunds, and GST returns.

### P1-6 No GST invoice
Indian payments above ₹0 require a GST-compliant invoice. `sendMembershipInvoice` sends a plain receipt email.
**Fix:** generate a numbered invoice PDF (sequential per FY), include GSTIN, HSN/SAC code, IGST/CGST/SGST split. Use `pdfkit` or a Razorpay-hosted invoice. Required for compliance, not optional.

### P1-7 Search ranking is naive
`getInfluencers` orders by `createdAt`. There is no relevance score, no online-first sort, no tier weighting.
**Fix for launch:** sort by composite `(isOnline DESC, lastSeenAt DESC, tier DESC, createdAt DESC)`. Real ranking deferred to v2 (Atlas Search or Postgres full-text).

### P1-8 No abuse / report flow
A user being harassed has no in-app way to report. Brand who gets ghosted by an influencer has no escalation path.
**Fix:** new `Report` model (reporterId, targetType, targetId, reason, status), `POST /api/reports`, admin list view. Minimal but required for trust.

### P1-9 No deliverable proof / acceptance state
Campaign workflow has stages but the "review and approve deliverable" step is not wired end-to-end. Brand cannot mark a deliverable accepted; influencer cannot trigger "payout due."
**Fix:** state machine in `CampaignWorkflow` with explicit transitions and a `POST /campaigns/:id/deliverables/:id/accept` (brand-only). Payout marked but not auto-triggered (manual for v1).

### P1-10 No PWA install metrics / manifest verification
PWA plugin is configured but no `manifest.json` is verified, no install-prompt event tracked. We don't know if the PWA actually installs on Android Chrome.
**Fix:** Lighthouse audit to PWA score ≥ 90, manually verify install on a real Android device, track `beforeinstallprompt` and `appinstalled` events in PostHog.

### P1-11 Sentry not wired on the client
`@sentry/react` is in deps but no `Sentry.init()` in `client/src/main.tsx`. Frontend errors disappear into the browser console.
**Fix:** init with `VITE_SENTRY_DSN`, wrap `<App>` in `Sentry.ErrorBoundary`, set release to git SHA.

---

## P2 — should-have, post-launch sprint 1

| ID | Item | File / Area |
|---|---|---|
| P2-1 | Admin dashboard (campaigns, users, contacts, reports) | `client/src/pages/Admin/*` (new) |
| P2-2 | Influencer payout flow (manual-trigger v1, Razorpay Payouts later) | `routes/payouts.ts` (new) |
| P2-3 | Email verification (link-based, separate from OTP) | `routes/auth.ts` |
| P2-4 | WhatsApp OTP delivery (twilio fallback already there?) | `services/whatsappService.ts` |
| P2-5 | Search filter persistence (URL-state) | `client/src/pages/Marketplace.tsx` |
| P2-6 | Influencer "set unavailable" toggle | `routes/influencers.ts` |
| P2-7 | Soft-delete on User (data retention) | `models/User.ts` |
| P2-8 | Robots.txt + sitemap.xml | `client/public/` |

## P3 — v2 / tech debt

| ID | Item |
|---|---|
| P3-1 | Migrate Mongo → Postgres (Supabase) |
| P3-2 | Adopt Next.js 15 App Router (replace Vite SPA + Express) |
| P3-3 | Replace polling chat with WebSockets (Supabase Realtime or Pusher) |
| P3-4 | Replace `console.log` with structured logger (`pino`) |
| P3-5 | Rate limiter to Redis (current is in-memory per-instance — useless on serverless) |
| P3-6 | Background jobs queue (Inngest or QStash) for invoices, emails, reminders |
| P3-7 | Object storage to Cloudflare R2 (cheaper than S3 in India egress) |
| P3-8 | Add `tokenVersion` → real refresh tokens |
| P3-9 | Atlas Search or Postgres `tsvector` for influencer search |
| P3-10 | E2E test coverage > 50% of critical paths |
| P3-11 | Lighthouse perf budget enforced in CI |
| P3-12 | i18n (English + Hindi for India launch) |

---

## Non-issues confirmed (claims in `CLAUDE.md` that the code actually upholds)

- ✅ Google ID token verified via `OAuth2Client.verifyIdToken()` (`authController.ts`)
- ✅ `express-mongo-sanitize` wired globally (`app.ts:59`)
- ✅ Fail-fast on missing JWT_SECRET / MONGODB_URI / GOOGLE_CLIENT_ID (`app.ts:39-41`)
- ✅ CORS allowlist via `CORS_ORIGINS` (`app.ts:45-53`) — no `origin: '*'`
- ✅ Pagination clamped `Math.min(limit||20, 100)` on list endpoints
- ✅ Admin-guarded contact routes (`contact.ts`)
- ✅ OTP hashed with bcrypt + 10-min TTL (`otpController.ts:22`)
- ✅ Gender param whitelisted (`influencerController.ts:8`)
- ✅ Platform 5% margin applied on read, raw stored (`utils/pricing.ts`)
- ✅ Razorpay webhook raw-body precedes `express.json()` (`app.ts:56-57`)

---

## How to use this document

1. Read top to bottom once.
2. Track P0 + P1 in `LAUNCH_PLAN.md` → each is a day-assigned task.
3. After 2026-05-01 launch, P2 becomes sprint 1 backlog; P3 becomes v2 input (`V2_MIGRATION_ROADMAP.md`).
4. Re-run this audit weekly until prod is stable.
