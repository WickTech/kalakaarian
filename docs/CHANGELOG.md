# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Session 12: Complete Account Deletion + Cascade Fixes (2026-05-18)

### Fixed
- **Account deletion leaves orphaned data** — audited all 25 FK constraints across the schema; fixed 3 tables with `NO ACTION` rules that either blocked deletion or left orphaned rows; added explicit conversation cleanup for the array-based `participant_ids` column that can't use DB cascades
- **`ratings` FK blocked deletion** — `ratings.rater_id` + `ratings.ratee_id` were `NO ACTION`; deleting any creator who had given or received ratings threw a FK violation and aborted the entire deletion; changed to `CASCADE` so ratings are removed with the user
- **`admin_audit_logs` + `feature_flags` orphaned rows** — `admin_id` and `updated_by` were `NO ACTION`; changed to `SET NULL` to preserve records while nullifying the deleted actor reference
- **Conversations never deleted** — `conversations.participant_ids` is a UUID array (no FK constraint possible); controller now explicitly fetches all conversations the user participated in, deletes their messages, then deletes the conversations before profile deletion
- **Phone-only OTP account purged** — deleted orphaned `auth.users` row for `9876543210` (OTP auth with no completed profile row)

### Schema
- **Migration `029_fix_delete_cascade.sql`** — repairs FK delete rules on `ratings`, `admin_audit_logs`, `feature_flags`

### Full deletion chain (post-fix)
`influencer_profiles` (→ analytics, pricing) → `ratings` → `memberships` → `proposals` → `campaigns` → `transactions` → `notifications` → `messages` → `conversations` → `profiles` → `auth.users`

### Commits
- `5c1a47c` — fix: complete account deletion — cascade rules + conversation cleanup

---

## [Unreleased] — Session 11: Delete Account Route Fix + Password Feedback (2026-05-18)

### Fixed
- **CRITICAL: Delete account silently blocked** — route-level validator checked `confirmation === 'DELETE'` (uppercase) but controller + client were updated to lowercase `'delete'`; `validate` middleware rejected every request before reaching the handler, so no account could be deleted; fixed route validator to `confirmation.equals('delete')` and added optional `password` field
- **No feedback on wrong password** — incorrect password only showed a generic toast; now shows inline error under the password field with red border so user knows exactly what failed
- **Techno Alcoholic mock account removed** — deleted `technoholic07@gmail.com` from `auth.users` (cascaded to profiles + influencer_profiles)

### Changed
- `server/src/routes/auth.ts` `DELETE /account` — validator updated: `confirmation.equals('delete')` + `body('password').optional()`
- `DeleteAccountModal` — password field clears its inline error on keystroke; wrong-password response surfaces as field-level error, not toast

### Commits
- `74867be` — fix: delete account blocked by route validator + inline password error

---

## [Unreleased] — Session 10: Delete Account + Marketplace Fixes (2026-05-18)

### Fixed
- **Marketplace empty after migration 028** — migration 028 added `marketplace_visible` + `is_discoverable` columns to `influencer_profiles` but was never applied to prod; server query filtered on non-existent columns → PostgREST error → 500 → brand saw empty marketplace; applied migration 028 to production DB
- **Deleted creator persists in marketplace** — `GET /api/influencers` had `Cache-Control: public, max-age=60, stale-while-revalidate=300`; Vercel edge served stale list for up to 6 minutes after deletion; changed to `no-store` so every brand page refresh hits the DB directly
- **Delete account cascade reliability** — server now explicitly deletes `influencer_profiles` / `brand_profiles` / `profiles` rows before calling `adminClient.auth.admin.deleteUser()` (belt-and-suspenders on top of ON DELETE CASCADE)

### Changed
- **Delete account — password verification** — server now fetches user's identities via `adminClient.auth.admin.getUserById()`; if user has email/password provider, verifies current password via `signInWithPassword` before deletion; Google-only accounts skip the password check
- **Delete account — confirmation word** — changed from `DELETE` (uppercase) to `delete` (lowercase) on both client and server
- **DeleteAccountModal** — new password field with show/hide toggle; confirmation input placeholder updated to `delete`; button disabled until `confirmation === "delete"`

### Data
- **Removed 40 mock creator accounts** — deleted all seeded test accounts (`@kalakaarian.in` — 9 Instagram mock creators, `@kalakaarian.test` — 31 YouTube mock creators) from production `auth.users` (cascaded to profiles + influencer_profiles); 3 real creator accounts preserved

### Commits
- `2f7d24e` — fix: delete account — password verify, marketplace cache, confirm word

---

## [Unreleased] — Session 9: Account Hub + Profile Fixes (2026-05-18)

### Added
- **Account Hub** — new `/account/*` hub with Google Account–style sidebar navigation (Home, Personal Info, Security, Connected Apps, Data & Privacy, Payments & Subscriptions); 6 section files under `client/src/pages/account/`
- **Role-aware sections** — Creator sees Connected Apps (IG/YT OAuth) + creator wallet/membership; Brand sees brand transactions; Super Admin `viewAs` respected throughout
- **Migration `028_account_preferences.sql`** — privacy flags (`is_discoverable`, `marketplace_visible`, `presence_visible`, `profile_visibility`) on `influencer_profiles` + `brand_profiles`; `notification_prefs jsonb` on `profiles`; `data_export_requests` table; all flags default `true` so existing rows unaffected
- **`/api/account/*` endpoints** — `POST /sign-out-all` (Supabase global signout), `GET /preferences`, `PUT /preferences` (whitelist-validated), `POST /data-export` (rate-limited, admin email alert)
- **Mobile sidebar drawer** — collapsible left-drawer for `<md` breakpoint in Account Hub
- **`sendAdminAlertEmail(subject, body)`** helper added to `emailService.ts`

### Changed
- **Creator login redirect** — `SmartHome` now sends authenticated creators to `/influencer/:id` (their own public profile page) instead of dashboard
- **Name persistence fix** — `updateInfluencerProfile` now writes `name` field to both `profiles` table and Supabase Auth user metadata; previously name was silently dropped, causing display names to show email-account names instead of registration names
- **ProfileHeader** — always renders Instagram + YouTube rows below the profile name; shows `@handle` in platform colour when connected, italic "not connected" when absent; location (city + state) moved to its own row below social handles
- **Marketplace visibility filter** — `buildInfluencerQuery` now adds `.eq('marketplace_visible', true).eq('is_discoverable', true)` so privacy flags are enforced on all brand-facing creator listings
- **Header** — "Settings" → "Account" (→ `/account`); Wallet → `/account/payments`
- **`OwnerActionsBar`** — Edit link → `/account/personal`; Settings link → `/account`
- **`MyProfile`** — Settings button → `/account`; Edit Profile button → `/account/personal`
- `/profile/edit` redirects to `/account/personal`
- `?tab=settings` removed from `InfluencerDashboard`; settings moved fully to hub

### Removed
- `SettingsTab` (stub) from `InfluencerDashboardPanels.tsx`
- `SocialConnect.tsx` — dead legacy component, superseded by `PlatformConnectCard` (zero callers confirmed before deletion)

### Commits
- `0fc75d7` — feat: account hub — Google-style /account/* settings with sidebar nav
- `91edfc0` — fix: creator login → own profile, name persistence, ProfileHeader social+location

---

## [Unreleased] — Creator UX Polish + Presence Fix (2026-05-18)

### Added
- **Gallery carousel controls** — radio-dot indicators on Kalakaar Portfolio carousel; owner-only Replace (swap image at selected index via new `replaceRef`) and Remove buttons below selected image; removes per-card trash overlay
- **Real-time profile sync** — `EditInfluencerProfile` invalidates `["influencer-profile", userId]` and `["influencer-profile-own"]` after save; profile page shows updated data immediately without reload
- **Commercials pricing lock** — pricing section locked for first 6 months from registration; client shows lock overlay with unlock date; server returns `403` with `unlockAt` if pricing update is attempted within 6-month window

### Changed
- **Marketplace access** — `/marketplace` moved from `BlockCreatorRoute` (anonymous pass-through) to `BrandRoute`; anonymous users and creators redirect to `/login` and `/` respectively; removed from default (logged-out) nav
- **Creator header dropdown** — removed "My Campaigns" entry; renamed "Earnings" → "Wallet" (links to `/influencer/dashboard?tab=wallet`); both desktop DropdownMenu and mobile Sheet updated
- **Influencer Dashboard cleanup** — removed Active toggle, Edit Profile button, Settings button from dashboard (these live on creator's own profile page `OwnerActionsBar`, not duplicated in dashboard)
- **Membership tab** — Silver/Gold plans with 1-month / 6-month / 12-month duration tabs; Silver: ₹119/99/79, Gold: ₹199/149/99 per duration

### Fixed
- **CRITICAL: Presence toggle reset on navigation** — `OwnerActionsBar` used local `useState` seeded from props; navigating away unmounted component and discarded state; on return, stale query cache re-initialized to old `isOnline`; fixed by calling `qc.setQueryData` on both `['influencer-profile', userId]` and `['influencer-profile-own']` after successful `api.updatePresence()` so the cache reflects the new state immediately
- **Presence sync from prop** — added `useEffect` to sync local `isOnline` state when the parent profile query refreshes (e.g. after cache invalidation from another tab)
- **CRITICAL: Proposal field name mismatch** — `proposals` Supabase table returns snake_case (`id`, `campaign_id`, `bid_amount`) but client `Proposal` interface expects camelCase (`_id`, `campaignId`, `bidAmount`); added `formatProposal()` transformer in `proposalController.ts` applied to `getProposals`, `getMyProposals`, `getProposalById`; fixes `campaignId=undefined` in video upload modal and `bidAmount=undefined` in campaign tracker
- **OAuth redirect params lost** — when `InfluencerAnalyticsPanel` had IG/YT platform subtabs removed, the `useEffect` handling `?ig_connected`, `?yt_connected`, `?ig_error`, `?yt_error` params was removed with it; restored in `InfluencerDashboard.tsx`

### Infrastructure
- **Marketplace `refetchInterval: 60_000`** — marketplace auto-refetches creator list (including `isOnline`) every 60s; brands see presence status changes within ~1 minute

### Commits
- `6640e98` — fix: persist presence toggle state across navigation
- `59c2b9c` — feat: remove duplicate presence/edit/settings controls from dashboard
- `1cd5ed0` — feat: creator UX polish — gallery carousel controls, profile sync, marketplace brand-only
- `f20d6f0` — feat: creator profile polish, upload modal, commercials lock, membership refresh
- `c4e4c8f` — feat: unify creator profile with marketplace view, remove proposals, move uploads to per-campaign
- `329fbaf` — fix: Active toggle optimistic update + delete account works for all auth types
- `3a2918e` — feat: campaign brief guidelines, acknowledgment checkbox, remove landing tier section

---

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
