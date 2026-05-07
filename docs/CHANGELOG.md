# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Phases 2–11 + P0 Security Fixes (2026-05-07)

### Added
- **Migration 016** — `cart_orders` table for Razorpay webhook reconciliation
- **Migration 017** — `ratings` table (`proposal_id`, `brand_id`, `influencer_id`, `score`, `review`); XP events table; `award_xp` + `recalculate_influencer_xp` RPCs
- **Checkout** — `POST /api/cart/checkout` creates Razorpay order with 8% platform fee; `POST /api/cart/webhook` advances `payment_released` idempotently
- **Proposal Workflow** — 9-stage lifecycle (shortlisted → payment_released); `GET /api/proposals/:id/workflow/public` (no auth); auto-approve countdown; live Share link; 15s polling
- **Live Campaign Tracking** — `/brand/campaigns/:id/track` page; `RecommendedCreators` on overview; `Track →` links from campaigns tab
- **Ratings** — `POST /api/proposals/:id/rate`; `GET /api/influencers/:id/ratings`; `InfluencerTrustSection` + `BadgeStrip` on profile; XP awarded per review
- **Dashboards** — `BrandAnalyticsPanel` (stage funnel, top campaigns); `InfluencerAnalyticsPanel` (completion rate, rating); `GamificationPanel` (XP + badges)
- **Deep Analytics** — `GET /api/analytics/brand/deep`; `GET /api/analytics/influencer/deep`
- **Recommendations** — `GET /api/recommendations/creators` (brand); `GET /api/recommendations/campaigns` (influencer)
- **Gamification** — `GET /api/gamification/influencer`; XP system Bronze→Platinum; 5 achievement badges; public badge endpoint
- **Creator Search** — `?name=` ilike on `GET /api/influencers`; sorted online→lastSeenAt→tier; TanStack Query in Marketplace

### Security (P0)
- OTP lockout returns 429 (was 400) after 5 failed attempts
- Membership activation idempotent on `(user_id, payment_id)` — prevents double-grant
- `/api/membership/status` filters expired rows via `gt('ends_at', now)`
- `POST /api/messages/send` blocks new conversations without a shared proposal relationship

### Schema (migrations applied 2026-05-07 to `uacdkzjgddivifvhjxyv`)
- **016** `cart_orders` — cart snapshot at checkout
- **017** `ratings`, XP events, `award_xp` RPC, `influencer_profiles.xp`

---

## [Unreleased] — Phase 1 Structured Campaign Workflow

### Added
- **Migration 015** — `proposals.workflow_stage` + activity log + cron heartbeat + `transition_workflow_stage` Postgres RPC (additive, nullable, no downtime)
- **Workflow v2 backend** — 7-stage proposal lifecycle with atomic RPC transitions and optimistic locking (`workflowActions.ts`, `workflowController.ts`, `cronController.ts`)
- **Workflow routes** — `GET|POST /api/proposals/:id/workflow/*` (11 endpoints behind `WORKFLOW_V2_ENABLED` flag)
- **Cron** — `POST /api/internal/cron/auto-approve` auto-approves expired `under_review` proposals; Vercel cron hourly
- **Workflow UI** — `StageTimeline`, `ActivityLogList`, `WorkflowDialogs` components; `ProposalDetail` page at `/proposals/:id`
- **TanStack Query hooks** — `useProposalWorkflow`, `useActivityLog`, `useWorkflowAction`
- **Feature flag** — `WORKFLOW_V2_ENABLED` + `VITE_WORKFLOW_V2_ENABLED` gate all new surfaces; legacy proposals unaffected

### Schema changes (migration 015)
- `proposals`: `workflow_stage`, `workflow_stage_updated_at`, `auto_approve_at`, `current_submission`, `transaction_ref` (all nullable)
- New table: `proposal_activity_log` (with RLS), `cron_runs`
- New RPC: `transition_workflow_stage`

---

## [Unreleased] — targeting 1 May 2026

### Remaining pre-launch blockers
- Add all new env vars to `.env.example` and Vercel dashboard
- Set `CORS_ORIGINS` to production domain in Vercel
- Register Razorpay webhook URL + copy secret to `RAZORPAY_WEBHOOK_SECRET`
- Switch Razorpay keys to live mode
- Full pre-ship checklist green (see `docs/SHIP_CHECKLIST.md`)
- Vercel preview smoke test

---

## [1.1.0] - 2026-04-20

### Added
- **Payments** — Razorpay two-step checkout for Silver/Gold membership (`POST /api/membership/order` → `POST /api/membership/purchase`); dev bypass when keys absent
- **Payments** — Razorpay async webhook handler (`POST /api/membership/webhook`) with HMAC-SHA256 signature verification and raw-body preservation
- **Payments** — Razorpay order embeds `{ userId, tier }` in notes so the webhook can activate membership without a user session
- **Email** — Resend email service: OTP fallback, welcome, membership invoice, proposal status notifications; fire-and-forget (never fails parent request)
- **Storage** — Cloudflare R2 presigned upload URLs (`POST /api/upload/presign`) with content-type whitelist per purpose
- **Observability** — Sentry error monitoring on both client (`@sentry/react`) and server (`@sentry/node`); conditional on `SENTRY_DSN`
- **Analytics** — PostHog product analytics; opt-out in non-prod environments; conditional on `VITE_POSTHOG_KEY`
- **Presence** — `isOnline` / `lastSeenAt` fields on `InfluencerProfile`; toggled via `PUT /api/influencers/presence`; green dot rendered on marketplace cards
- **Gender filter** — server-side `?gender=` query param (whitelisted against `ALLOWED_GENDERS`); Marketplace re-fetches on change
- **Referrals** — `checkAndGrantGoldReward`: auto-grants 1-year Gold to referrer when they reach 10 referred users with active Gold memberships
- **Client** — `openRazorpayCheckout` utility with lazy CDN script loading and typed Promise interface
- **Client** — `updatePresence(isOnline)` API call wired to profile status toggle

### Changed
- Tier enum corrected across client: `celebrity` removed, `mid` and `mega` added to match server (`nano | micro | mid | macro | mega`)
- `InfluencerProfile.tsx` membership upgrade flow replaced with full Razorpay checkout (was a stub)
- Gender filtering moved from client-side mock (`genderSplit` percentages) to real server-side query
- `docs/API.md` fully rewritten to match the actual deployed API (correct base URL, field names, all routes)
- Deployment guide updated: Railway removed, Vercel handles both frontend and serverless backend

### Security
- Razorpay webhook signature verified with HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET` before any DB writes
- R2 presign endpoint validates `contentType` against per-purpose allowlist before issuing URL
- Google ID tokens continue to be verified via `OAuth2Client.verifyIdToken()` — no regressions

---

## [1.0.0] - 2026-01-01

### Added
- Initial project setup with npm workspaces monorepo (client / server / packages/models)
- Docker configuration (optional MongoDB only)
- User authentication: register, login, Google OAuth, WhatsApp OTP
- User roles: brand / influencer
- Profile management
- Campaign CRUD operations + open-listing browse
- Proposal submission and response workflow
- Cart functionality
- Referral code generation and application
- Basic API documentation
- Vercel serverless deployment (`serverless-http`, no `app.listen`)

---

## Version History Template

Copy this template for new releases:

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Changed behavior of X

### Deprecated
- Deprecated Y (will be removed in v2.0.0)

### Removed
- Removed Z (deprecated in v1.2.0)

### Fixed
- Bug in component X

### Security
- CVE-XXXX-XXXX patch
```

---

## Release Types

- **Major (X.0.0)**: Breaking changes, significant new features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible

---

## Git Tagging

After each release, create a git tag:
```bash
git tag -a v1.0.0 -m "Version 1.0.0 - Initial release"
git push origin v1.0.0
```

---

## Automated Releases

Consider setting up:
- GitHub Actions for CI/CD
- Semantic Release for automated versioning
- CHANGELOG auto-generation from commit messages
