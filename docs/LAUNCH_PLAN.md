# Kalakaarian — Launch Plan (2026-04-25 → 2026-05-01)

> 6 working days. User test on Mon Apr 27 (staging cohort). Public launch Fri May 1.
> Each day below has agent assignments (backend / frontend / db / devops / qa / pm), inputs, outputs, and an exit gate. Treat the gate as a hard "go/no-go."

## Calendar at a glance

| Date | Day | Theme | Hard gate at EOD |
|---|---|---|---|
| Sat Apr 25 | D-6 | P0 fixes start, infra prep | All P0s have a PR open |
| Sun Apr 26 | D-5 | P0 fixes land + smoke tests | P0s merged on `staging`; CI green |
| Mon Apr 27 | D-4 | **User test (alpha cohort, staging)** | 5 brands + 10 influencers complete one round-trip |
| Tue Apr 28 | D-3 | P1 fixes (analytics, Sentry, GST, search ranking) | PostHog firing; Sentry catches synthetic error |
| Wed Apr 29 | D-2 | Content (privacy/terms/landing copy) + abuse flow | `/privacy`, `/terms`, `/report` live on staging |
| Thu Apr 30 | D-1 | Hardening, load test, dress rehearsal, freeze | Code freeze 18:00 IST. Final security gate green. |
| **Fri May 1** | **D-0** | **Public launch** | Prod deploy by 10:00 IST. Smoke check by 11:00. |

---

## Sat Apr 25 — D-6 — P0 fixes start

### Backend agent
**In:** AUDIT.md P0-1, P0-2, P0-3, P0-4.
**Out (today, PRs open by EOD):**
1. PR `fix/otp-attempt-lockout` — increment `attempts` atomically; lock after 5; add `verifyOtpLimiter` (10/15min/phone). Touches `controllers/otpController.ts`, `routes/auth.ts`. Test: vitest + supertest.
2. PR `fix/membership-idempotency` — `paymentIds: string[]` on Membership; activation idempotent + extends not resets; `/purchase` only verifies, `/webhook` activates. Touches `models/Membership.ts`, `routes/membership.ts`, `services/razorpayService.ts`. Test: replay webhook 3×, expect single activation.
3. PR `fix/membership-expiry-check` — `/status` returns `regular` if `endDate < now`. Touches `routes/membership.ts:91`.
4. PR `fix/messages-relationship-guard` — verify receiver exists; verify sender has Conversation OR Proposal OR Campaign-link with receiver before allowing first message; per-sender 30/5min limiter. Touches `routes/messages.ts`.

### Devops agent
**In:** Vercel project, Mongo Atlas (prod + staging clusters needed).
**Out:**
- Create `staging` Mongo Atlas DB (separate cluster or DB on same cluster).
- Create Vercel preview branch alias: `staging.kalakaarian.com` → `staging` git branch.
- Add Vercel env vars for staging (separate `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS=https://staging.kalakaarian.com`).
- Open `.github/workflows/ci.yml` PR (typecheck + lint + test on PR; required check on `main`).

### PM (you) agent
**Out:**
- Resolve open questions in PRD §11: GST status, Razorpay KYC, WhatsApp BSP status, domain SSL, privacy/terms drafts.
- Confirm 5 brand pilots + 15 influencer pilots for Apr 27 user test. Send invites with staging URL placeholder.

### Gate (EOD Sat)
- [ ] 4 backend PRs open with passing local tests
- [ ] Staging branch + Vercel env exists
- [ ] CI workflow PR open
- [ ] User-test cohort confirmed

---

## Sun Apr 26 — D-5 — P0 land + server smoke tests

### Backend agent
**In:** Yesterday's PRs.
**Out:**
- Merge all 4 P0 PRs to `staging`.
- New PR `chore/server-smoke-tests` (P0-5). Vitest + supertest. Minimum 20 cases:
  - register → login → /profile (token roundtrip)
  - register, send-OTP, verify (success + 5 failed attempts → locked)
  - create campaign as brand → list as influencer → submit proposal
  - membership /order → /purchase signature reject (bad sig) → /webhook idempotency (replay 3×)
  - GET /influencers gender whitelist (reject `?gender=foo`)
  - escapeRegex (search `q=.*` returns no spurious matches)
  - DM send to non-related user → 403
  - Pagination clamp (limit=999 → 100)
  - JWT expired → 401
  - Admin route without admin → 403
- Add `npm run test` script in `server/package.json`.
- Wire CI to run server tests.

### QA agent
**Out:** Manual checklist run-through on staging (auth, campaign create, proposal, membership). Bug bash. File issues with severity tags.

### Frontend agent
**In:** P1-1 PostHog wiring spec.
**Out:**
- `client/src/lib/posthog.ts` init helper using `VITE_POSTHOG_KEY`.
- Track events: `signup_started`, `signup_completed`, `role_selected`, `profile_completed`, `social_connected`, `campaign_created`, `proposal_submitted`, `proposal_accepted`, `message_sent`, `membership_purchased`, `referral_used`, `pwa_installed`. (See METRICS.md.)
- Sentry client init (P1-11). Wrap `<App/>` in `Sentry.ErrorBoundary`. Release = git SHA via `VITE_SENTRY_RELEASE`.

### Gate (EOD Sun)
- [ ] All P0 PRs merged on `staging`
- [ ] CI green on `staging` branch
- [ ] PostHog firing 1+ event end-to-end on staging
- [ ] Sentry client catches a synthetic error in staging
- [ ] QA bug list: ≤ 5 P1 issues open, 0 P0 open

---

## Mon Apr 27 — D-4 — **User test (staging cohort)**

### PM agent (lead)
- Send staging URL + walkthrough script to cohort at 10:00 IST.
- Slot 1 (10:00–12:00): 5 brands → create account → post 1 campaign → review pre-seeded proposals.
- Slot 2 (14:00–16:00): 10 influencers → create account → connect IG → submit 1 proposal.
- Slot 3 (16:00–18:00): 5 mixed pairs → end-to-end (proposal → chat → membership purchase test in staging Razorpay).
- Capture feedback: in-app feedback widget (1 input, 1 textarea) + WhatsApp group + 15-min calls.

### QA agent
- Sit on Sentry + PostHog dashboards in real time.
- Triage every reported issue same-day; tag P0/P1/P2.

### Backend + frontend agents
- On-call. Hot-fix only P0. Other issues go to backlog.

### Gate (EOD Mon)
- [ ] ≥ 5 brands and ≥ 10 influencers completed flow
- [ ] No P0 issue uncovered (or all P0 issues hot-fixed by 22:00)
- [ ] User feedback synthesized (themes; 3-line summary per persona)
- [ ] Decision: launch on track (✅ continue) or slip 3-7 days (❌ replan)

---

## Tue Apr 28 — D-3 — P1 batch

### Backend agent
- P1-4 JWT TTL → 7d, `User.tokenVersion` claim, increment on logout.
- P1-5 `Transaction` writes on every paid event (purchase + webhook).
- P1-7 Search composite sort (`isOnline DESC, lastSeenAt DESC, tier rank DESC, createdAt DESC`).
- P1-8 `Report` model + `POST /api/reports` + admin list.

### Frontend agent
- P1-9 Deliverable accept UI in brand dashboard (calls `POST /campaigns/:id/deliverables/:id/accept`).
- P1-8 `/report` modal accessible from influencer profile + chat.
- Resolve P1 visual issues from user-test feedback.

### Devops agent
- P1-6 GST invoice: integrate Razorpay's hosted invoice or generate via `pdfkit`. Number sequence per FY (`2026-27/INV/0001`). Include GSTIN, HSN/SAC `998314`, IGST 18%.
- Add HSTS + minimal CSP header in `vercel.json`.
- Run `npm audit --audit-level=high` in both workspaces; fix or document.

### Gate (EOD Tue)
- [ ] All P1-* PRs merged to staging
- [ ] PostHog dashboard shows 7-day funnel skeleton
- [ ] Sentry: 0 unresolved errors > P3 from user test
- [ ] GST invoice generates correctly in staging

---

## Wed Apr 29 — D-2 — Content + dress rehearsal pass 1

### Content agent (PM)
- `client/src/pages/Privacy.tsx` (DPDP-compliant) and `Terms.tsx` — legal-reviewed text.
- DPDP consent banner component → first-visit, store consent in localStorage + emit PostHog `consent_given`.
- Landing-page copy polish; CTAs verified.
- Founders' note / About page.

### Frontend agent
- PWA verification on real Android Chrome (P1-10): install banner, offline page works, app icon correct.
- Lighthouse audit: PWA ≥ 90, Performance ≥ 80, A11y ≥ 90.
- Empty states everywhere (no campaigns, no proposals, no messages).
- 404 page.

### Backend agent
- Backfill production DB seed (200 curated influencers, scrubbed test data).
- Migration script: ensure all P0 fixes' schema deltas applied.
- Verify production Razorpay keys, WhatsApp Cloud API token, SMTP creds work in **staging** env (don't test in prod).

### QA agent
- End-to-end Playwright suite expanded: signup brand + influencer, post campaign, submit proposal, send message, buy Gold (test mode).

### Gate (EOD Wed)
- [ ] `/privacy`, `/terms`, consent banner live on staging
- [ ] Lighthouse PWA ≥ 90
- [ ] Playwright e2e: 8+ critical paths green
- [ ] Production env vars staged in Vercel (not yet promoted)

---

## Thu Apr 30 — D-1 — Hardening + freeze

### Devops agent
- **Code freeze 18:00 IST.** No merges to `main` after this except hot-fixes signed off by Rishi.
- Promote production env vars in Vercel.
- Custom domain `kalakaarian.com` + `www.kalakaarian.com` SSL verified.
- DNS TTL lowered to 300s for fast rollback.
- Sentry release tag = today's git SHA on `main`.
- Mongo Atlas: confirm M10+ tier with daily backup; staging on M0 ok.

### Backend agent
- Final security gate: tick every box in `SECURITY_REVIEW.md` § Final pre-launch security gate.
- Tag-and-protect prod admin user. Strong password + 2FA on email.
- Razorpay live keys swapped (not pushed to repo; only Vercel env).

### QA agent
- Smoke test on `main` deployed to staging (final pre-prod check):
  - Sign up new brand, new influencer
  - Post campaign, submit proposal, accept proposal
  - Send messages
  - Purchase Silver membership (test → live mode toggle)
  - Verify GST invoice email
  - Hit `/health` returns ok
  - Forced 401 / 403 / 429 / 500 each render correctly
- Soak: 30-minute tab open, no leaks, SW upgrades cleanly.
- Mobile: Android Chrome + iOS Safari sanity pass.

### PM agent
- Launch comms drafts: founder LinkedIn post, WhatsApp broadcast to pilot list, Twitter/X, ProductHunt teaser (don't ship until launch day).
- Support inbox setup (`hello@kalakaarian.com` → routed).

### Gate (EOD Thu)
- [ ] Final security gate 100% ticked
- [ ] Smoke test 100% pass
- [ ] Comms drafts approved
- [ ] On-call schedule for May 1: Rishi 09:00–14:00 IST primary; (assign secondary)

---

## Fri May 1 — D-0 — **Launch**

### Timeline (IST)
- **08:30** — Devops: pre-flight checklist (DB up, Sentry up, PostHog up, Razorpay live).
- **09:00** — Backend agent: merge `staging` → `main`, Vercel auto-deploys.
- **09:15** — Smoke test on prod: signup, campaign, proposal, message, /health.
- **09:30** — Confirm Sentry release attached, PostHog events firing.
- **10:00** — Public launch comms go live (LinkedIn + WhatsApp).
- **10:00–14:00** — Rishi monitors: Sentry, PostHog real-time, Mongo Atlas perf, Vercel logs.
- **14:00** — First 4-hour metrics check: signups, errors, p95.
- **18:00** — End-of-day report: see "Day-1 metrics gate" below.

### Day-1 metrics gate (EOD May 1)
- Signups (brand + influencer combined) ≥ 25 → pass
- 0 P0 incidents (or all hot-fixed within 1 hr)
- Crash-free sessions ≥ 99%
- p95 API latency ≤ 1.2s

### Rollback plan
- If P0 incident in first 6 hours: revert via Vercel one-click rollback to last green build.
- DNS unchanged (same domain), no DB schema rollback needed for any of the P0/P1 PRs (additive only).
- Comms: post a status update if rolling back; commit to ETA.

---

## Per-agent backlog summary (this week)

| Agent | Mon-Sat workload (h) | Top 3 deliverables |
|---|---|---|
| Backend | ~36 | P0 fixes, server tests, Transaction log + GST + ranking |
| Frontend | ~28 | PostHog + Sentry init, deliverable-accept UI, PWA verify |
| Devops | ~16 | Staging env, CI workflow, Vercel headers, prod swap |
| QA | ~20 | Playwright e2e, manual bug bash, smoke checks |
| Content/PM | ~16 | PRD ans, privacy/terms, comms, user-test cohort |

---

## Risks & call-the-shot decisions

| Decision deadline | Question | Default if no answer |
|---|---|---|
| Sun Apr 26 EOD | GST registered? | If no: free Silver/Gold for first 14 days; collect emails for billing once ready |
| Sun Apr 26 EOD | Razorpay live KYC done? | If no: keep memberships free; launch as discovery-only |
| Tue Apr 28 EOD | WhatsApp Cloud API approved? | If no: SMS via Twilio (₹0.50/msg) or email-only OTP |
| Thu Apr 30 noon | Lighthouse PWA ≥ 90? | If no: ship without "install" CTA; remove install banner |
| Fri May 1 09:00 | Smoke test green on prod? | If no: postpone announce comms by 4–24 hours |
