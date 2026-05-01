# Kalakaarian — Overnight Handoff (2026-04-25 → 04-26)

> One-page exec summary. Full plan in linked docs.

## TL;DR

You asked me to: analyze the current PWA, find flaws, plan a complete version, design a new tech stack, and lay out build → test → deploy. I did all four, but I locked the launch plan to **harden + ship the current stack by May 1**, with the v2 stack as a **post-launch parallel design** (not a pre-launch rewrite). A 6-day rewrite would miss both Mon Apr 27 user testing and the May 1 launch.

You confirmed this scope before going to sleep:
- **Scope:** harden + ship current stack
- **v2 design target:** India MVP (0–50k users)
- **Top concerns:** payments, auth/security, marketplace flow, ops readiness

I produced 9 documents in `docs/`. Read them in this order on Sunday morning:

| # | Doc | What it gives you | Read time |
|---|---|---|---|
| 1 | [HANDOFF.md](./HANDOFF.md) | This page | 3 min |
| 2 | [AUDIT.md](./AUDIT.md) | Concrete flaws, P0–P3, with file:line | 10 min |
| 3 | [LAUNCH_PLAN.md](./LAUNCH_PLAN.md) | Day-by-day Apr 25 → May 1 with agent assignments | 15 min |
| 4 | [FEATURE_SPECS.md](./FEATURE_SPECS.md) | Per-feature spec → API → DB → tests → deploy | 25 min (skim) |
| 5 | [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) | Pre-launch security gate | 8 min |
| 6 | [TEST_PLAN.md](./TEST_PLAN.md) | Apr 27 user-test protocol + automated test pyramid | 8 min |
| 7 | [METRICS.md](./METRICS.md) | North-star + PostHog event spec + targets | 6 min |
| 8 | [PRD_V1.md](./PRD_V1.md) | Locked launch scope | 8 min |
| 9 | [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) | Runbook + DR + cost | 6 min |
| 10 | [V2_ARCHITECTURE.md](./V2_ARCHITECTURE.md) | Target: Next.js 15 + Supabase + Inngest | 12 min |
| 11 | [V2_MIGRATION_ROADMAP.md](./V2_MIGRATION_ROADMAP.md) | 12-week strangler-fig migration | 10 min |

## The 5 things blocking launch (P0)

These will burn you on Monday's user test or the May 1 launch. I have a fix spec for each in `FEATURE_SPECS.md`.

1. **OTP brute-force** — `attempts` counter is dead code. Attacker can guess 6-digit codes inside the 10-min TTL with no lockout. (`server/src/controllers/otpController.ts:47-91`)
2. **Membership double-activation** — `/purchase` and `/webhook` both write `endDate`, so a single payment can extend membership ~60 days. Webhook replays multiply this. (`routes/membership.ts:59-70` and `:136-147`)
3. **Expired memberships still served as Gold** — `/status` ignores `endDate`. Year-old expired Gold returns as Gold. (`routes/membership.ts:91-99`)
4. **DM spam** — any signed-up user can DM any other user. No relationship guard. (`routes/messages.ts:9-50`)
5. **Zero server-side test coverage** — going live with payments, OTP, auth and no smoke tests is roulette.

All five are fixable in a single Saturday by your backend agent. See `LAUNCH_PLAN.md → Sat Apr 25` and `FEATURE_SPECS.md → F1–F5`.

## What I locked in for you (decisions you can override)

- **Cut JWT TTL 30d → 7d** with a `tokenVersion` claim for instant logout.
- **Source-of-truth for membership activation = webhook** (purchase only verifies + responds).
- **Ranking = `(isOnline DESC, lastSeenAt DESC, tier DESC, createdAt DESC)`** for v1; real search in v2.
- **Staging env required** before user test — separate Mongo, separate Vercel branch alias.
- **CI required check on `main`** — typecheck + lint + test must be green to merge.
- **GST invoice mandatory** for paid memberships at launch — otherwise keep paid tiers free for week 1.

## The 5 hard questions you must answer Sunday morning

These gate the launch plan. If any is "no," sub-plans flip:

1. **GST registered?** If no → defer paid tiers; collect emails for billing later.
2. **Razorpay live KYC done?** If no → memberships free for week 1.
3. **WhatsApp Cloud API approved?** If no → email OTP only (already wired) or Twilio SMS fallback.
4. **Domain `kalakaarian.com` + SSL on Vercel?** If no → block launch comms until done.
5. **Privacy / Terms drafted + legally reviewed?** If no → critical for DPDP compliance; needs by Wed Apr 29.

Answer these by EOD Sunday. They're tracked in `LAUNCH_PLAN.md → Sat Apr 25 → PM agent`.

## What I did NOT do tonight (deliberate)

- **No code changes.** Doing P0 fixes without you to approve diffs would breach the 95% rule. I have detailed change specs in `FEATURE_SPECS.md` (file + line) that your backend agent can implement Saturday morning.
- **No DB migrations.** Same reason.
- **No deploys.** Same.

## What's saved where

- All docs in `docs/` of the repo.
- Memory files saved (your role, the project context, the launch decisions).
- Task list seeded — `TaskList` tool will show progress when you resume.

## My recommended first 3 hours Sunday morning

1. (15 min) Read HANDOFF.md (this) + AUDIT.md.
2. (15 min) Skim LAUNCH_PLAN.md and confirm the day-by-day schedule.
3. (30 min) Answer the 5 hard questions above.
4. (1 hr) Get backend agent started on F1–F4 (the four P0 PRs). I have spec + tests for each.
5. (30 min) Get devops agent started on F16 (staging env + CI workflow) and F17 (security headers).
6. (30 min) Get frontend agent started on F6 (PostHog) and F7 (Sentry client).

By Sunday EOD you'll have all P0 fixes merged on staging, PostHog firing, and CI green — putting Monday's user test on solid ground.

---

**Sleep well. The plan is concrete enough that you can wake up and execute, not re-decide.**

— Claude (PM + Tech Architect)
