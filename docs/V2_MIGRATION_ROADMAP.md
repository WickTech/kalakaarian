# Kalakaarian — v2 Migration Roadmap (Strangler-Fig, 12 weeks)

> Start: week of 2026-05-04 (after v1 launch and 1-week stabilization).
> Target: full cutover by 2026-08-04 (12 weeks).
> Strategy: **strangler-fig**. v2 (Next.js + Supabase) runs alongside v1 (Vite + Express + Mongo). One workflow at a time migrated. Reversible at each phase.

## Guiding rules

1. **Never break prod.** Every phase ends with both v1 and v2 working. If v2 fails, traffic still goes to v1.
2. **One feature, one migration.** Don't migrate auth, chat, payments, search all at once.
3. **Data is migrated last.** Until cutover, Postgres is read-only mirror of Mongo for any not-yet-cut feature.
4. **Reads first, writes second.** For each feature, migrate read endpoints first; then writes after dual-writes are confirmed clean.
5. **Feature flag everything.** Toggle via env or Statsig/PostHog feature flags. Roll back instantly.

## Phase overview

| Phase | Weeks | Outcome | Reversibility |
|---|---|---|---|
| 0. Stabilize v1 | W1 (May 4–10) | Launch bugs squashed; metrics solid | n/a |
| 1. v2 scaffold | W2 (May 11–17) | Next.js app deployed at `next.kalakaarian.com`. Empty routes. | Trivial — delete deploy. |
| 2. Schema + auth dual-stack | W3-4 (May 18–31) | Postgres schema migrated; Supabase Auth running parallel; users sync via outbox. | Auth still served by v1. |
| 3. Public reads on v2 | W5 (Jun 1–7) | Landing, marketplace, influencer profile served by v2 (RSC). v1 still owns writes. | Flag flip back to v1 in 1 min. |
| 4. Chat on Supabase Realtime | W6-7 (Jun 8–21) | Conversations + messages migrated to Postgres + Realtime; v1 chat read-only fallback. | Re-enable v1 chat write path. |
| 5. Campaign + proposal writes | W8-9 (Jun 22–Jul 5) | Brand and influencer flows on v2. v1 retired for these. | Branch revert if needed. |
| 6. Payments on v2 | W10 (Jul 6–12) | Razorpay webhook handled by Next.js route handler. Inngest jobs for invoices. | Switch back to v1 webhook URL in Razorpay. |
| 7. Background jobs | W11 (Jul 13–19) | Inngest cron (expiry, reminders, presence cleanup). Mongo TTLs decommissioned. | Re-enable v1 cron / TTLs. |
| 8. Cutover + decommission | W12 (Jul 20–Aug 4) | 100% traffic on v2. v1 read-only. Dual-write disabled. v1 frozen for 2 weeks then decommissioned. | Final reversal possible Aug 1; after Aug 4 only data restore. |

## Phase 0 · Stabilize v1 (W1)
- Triage launch-week bugs.
- Confirm metrics dashboards are wired correctly.
- Lock down P0/P1 backlog from `AUDIT.md`.
**Exit:** crash-free ≥ 99.5%, no SEV1/SEV2 open.

## Phase 1 · v2 scaffold (W2)
- Bootstrap monorepo: Turborepo + pnpm, `apps/web` Next.js 15 + Tailwind + shadcn.
- Set up Vercel project `kalakaarian-v2`. Bind to `next.kalakaarian.com`.
- Wire Sentry, PostHog, Inngest, Supabase clients. Health route.
- CI: lint, test, typecheck, build.
**Exit:** deploy with one /health route returning `{ ok: true }`.

## Phase 2 · Schema + auth dual-stack (W3-4)
- Translate v1 Mongo schemas → Postgres DDL. Apply migrations to Supabase.
- Write **outbox pattern** in v1 server: every write also enqueues an event to a `mongo_events` Mongo collection.
- New Inngest job in v2: poll `mongo_events`, write to Postgres. Backfill historical Mongo data via one-shot script (`scripts/backfill-mongo-to-pg.ts`).
- Stand up Supabase Auth. Keep v1 issuing JWTs for now. Mirror users to Supabase Auth via outbox (admin API).
**Exit:** every Mongo write reflected in Postgres ≤ 60s. Backfill < 1% drift.

## Phase 3 · Public reads on v2 (W5)
- Implement RSC pages on v2: `/`, `/marketplace`, `/influencer/[id]`, `/privacy`, `/terms`.
- Reverse-proxy at the edge (Vercel rewrite or Cloudflare): public routes → `next.kalakaarian.com`, everything else → v1.
- Run for 7 days; monitor latency and errors.
- Once green, flip primary domain `kalakaarian.com` to v2 for those routes.
**Exit:** landing TTFB < 300ms, no errors > P3 in Sentry.

## Phase 4 · Chat on Supabase Realtime (W6-7)
- Migrate conversations + messages to Postgres (already replicating).
- Implement chat UI in v2 with Supabase Realtime subscriptions.
- Dual-write: v1 message endpoint writes to both Mongo and Postgres for 7 days (transition window).
- Switch chat reads to Postgres in client.
- Cut v1 chat write path; redirect v1 `/api/messages/send` to call v2 endpoint internally.
**Exit:** chat latency p95 < 200ms; 0 message loss in 7-day overlap.

## Phase 5 · Campaign + proposal writes (W8-9)
- Implement v2 campaign create/edit/delete via server actions.
- Implement v2 proposal submit / accept / reject.
- Use feature flag: 10% of traffic on v2 for these flows for 3 days. Then 50%. Then 100%.
- v1 endpoints become read-only.
**Exit:** all writes on v2; Mongo no longer modified for these collections.

## Phase 6 · Payments on v2 (W10)
- Build Next.js route handler `/api/razorpay/webhook`. Same idempotency contract as v1.
- Razorpay dashboard: switch webhook URL to v2.
- Run synthetic charges for 24 hours.
- Swap `/api/membership/order` and `/api/membership/purchase` to v2 server actions.
**Exit:** 0 missed activations in 7 days; v1 payment paths returning 410 Gone.

## Phase 7 · Background jobs (W11)
- Migrate logic from v1 inline async to Inngest functions.
- Cron: expire-memberships, presence-cleanup, weekly-rollup.
- Event: send-invoice, referral-gold-reward.
- Decommission Mongo TTLs after equivalent Postgres-side jobs are stable.
**Exit:** All jobs in Inngest dashboard with retries configured. v1 has no scheduled work.

## Phase 8 · Cutover + decommission (W12)
- 100% traffic to v2. v1 set to read-only (mongoose connection in read-preference `secondaryPreferred`, all writes return 410 Gone).
- Disable outbox + dual-write paths.
- Keep v1 deploy alive 14 days (data forensics).
- After 14 days: revoke v1 Razorpay webhook, decommission Vercel project, archive Mongo cluster (downgrade to free tier; export full dump to R2 cold).
**Exit:** v2 only; v1 archive cold-stored; team-internal post-mortem written.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Outbox falls behind during high-traffic hour | Medium | Lag alert in Sentry > 5 min; pause writes if > 30 min lag |
| Postgres schema migration locks table | Low | Use `concurrently` for indexes; run during low-traffic window |
| Razorpay misroute during webhook switch | Medium | Keep v1 webhook listening + idempotent until v2 confirmed clean for 24h |
| Auth session drift (user logged in on v1 not on v2) | High | Run Supabase Auth in parallel from W3; cookies set for both domains |
| RLS policy bug exposes data | Critical | Test suite for every policy with synthetic users |
| Cost overrun on Supabase | Low | Pro tier hard-caps; alerts at 80% |

## Per-phase exit gates (DO NOT skip)

| Phase | Gate |
|---|---|
| 0 | crash-free ≥ 99.5%, no SEV1/2 |
| 1 | /health returns 200; CI green |
| 2 | Outbox lag < 60s; backfill drift < 1% |
| 3 | Public reads served by v2 for 7 days, no Sentry P0/P1 |
| 4 | 0 message loss in 7-day dual-write |
| 5 | 100% campaign+proposal writes on v2 for 3 days |
| 6 | 0 missed activations in 7 days |
| 7 | Inngest dashboard shows all crons + events green |
| 8 | 100% traffic on v2; v1 read-only; no errors |

## Effort estimate (solo dev = Rishi, with Claude as agent team)

- Phase 0: 5 days
- Phase 1: 5 days
- Phase 2: 10 days
- Phase 3: 5 days
- Phase 4: 10 days
- Phase 5: 10 days
- Phase 6: 5 days
- Phase 7: 5 days
- Phase 8: 5 days

= **60 working days** ≈ 12 weeks at 5 days/week. Buffer absorbs surprises.

## Communication plan
- Weekly status: Mon 09:00 (PM-tracked)
- Per-phase post-mortem (if reverted)
- User-facing changelog entry on every phase that touches their UX (e.g. realtime chat upgrade)

## Hard prerequisites (don't start phase 1 until done)
- v1 launch stable for 1 week (no SEV1/2)
- Razorpay live KYC complete
- GST registration complete (or formal decision to defer paid tier)
- Privacy / Terms / DPDP consent live
