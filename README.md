# Kalakaarian — India's Creator-Brand Marketplace

Connect brands with creators. Discover authentic partnerships that drive real campaign results.

**Live:** [kalakaarian.com](https://kalakaarian.com) · **API:** [kalakaarian-server.vercel.app](https://kalakaarian-server.vercel.app)

---

## Project Overview

Kalakaarian is a two-sided marketplace for influencer marketing in India. Brands discover and book creators across Instagram and YouTube; creators set their own rates, manage proposals, and track payments — all in one platform.

**Core value:**
- Brands browse 4 influencer tiers (Nano → Celebrity), filter by genre/location/gender/platform, add creators to a cart, and submit campaign briefs
- Creators register with their handles, set per-format pricing, browse open campaigns, and receive proposals
- Platform applies a transparent 5% margin on all brand-facing pricing + 8% fee at checkout (both server-enforced)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query v5 |
| Backend | Express 4 + TypeScript — deployed as Vercel serverless via `serverless-http` |
| Database / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Razorpay (order create → verify; webhook for memberships) |
| Email | Resend |
| Monitoring | Sentry (client + server, optional) + PostHog (product analytics) |
| CI/CD | GitHub Actions — vibe-guard security scanner on every push/PR to `main` |

**Deploy cost:** $0/month on Vercel free tier + Supabase free tier.

---

## Current Features (✅ Completed)

### Global Navigation
- Sticky glassmorphism header across every page — scroll hide/show
- Logo, nav links (Home / Marketplace / Campaigns / Contact)
- Auth-aware: notification bell + cart icon + avatar dropdown for logged-in users; Login / Get Started for guests
- **Role-aware nav** — brands: Home / Marketplace / Campaigns / Contact; Kalakaars: Home / Dashboard / Campaigns / Contact
- **Role-aware header icon** — Kalakaars see gold Wallet icon (→ `/influencer/dashboard?tab=wallet`); brands see Shopping Cart (→ `/cart`)
- Role-aware dashboard link (brand → `/brand/dashboard`, influencer → `/influencer/dashboard`)
- **Role-aware "Campaigns" nav link** — brands go to `/brand/dashboard?tab=campaigns`; Kalakaars go to `/campaigns`
- Mobile hamburger Sheet menu
- Dark obsidian theme — `bg-obsidian/95 backdrop-blur` with white/10 borders
- Right-side icons (Bell, Cart/Wallet, Avatar) spaced with `gap-3` for clean alignment

### Authentication & Onboarding
- Email + password login with role detection (brand / creator)
- Google OAuth login
- WhatsApp OTP (send + verify; requires WhatsApp Business API keys)
- Role toggle on login page (Creator / Brand tabs)
- Password visibility toggle (eye icon)
- Back-to-home button on login
- Brand registration — company name, industry, Indian state, confirm password, T&C modal
- Influencer registration — 5-step wizard: basic info → genre → platforms → rates → location; T&C modal with age + terms checkboxes before final submit
- Social handle verify buttons (Instagram / YouTube — opens public profile in new tab for manual verification)

### Landing Page
- Full-screen hero with oversized typography (`text-5xl → text-8xl` responsive)
- Live tier count grid: Nano / Micro / Macro / Celebrity (fetched from API)
- Auto-scrolling brand carousel (marquee) — 20 real Indian brand names
- "Why Kalakaarian" feature section
- Floating contact button (bottom-right, persistent across pages)
- PWA install prompt for mobile browsers
- Dark obsidian theme throughout — charcoal tier cards, chalk text, obsidian footer

### Marketplace
- **Brand-login-only** — `/marketplace` requires brand authentication (`BrandRoute`); anonymous users and creators are redirected; not linked from the landing page nav
- 4-column Kalakaar grid (responsive: 2 → 3 → 4 columns)
- Rising Stars carousel — top Kalakaars by follower count
- Search bar ("Search Kalakaars…"), debounced 350 ms
- Filter drawer: Kalakaar Tier, Genre, Kalakaar Gender, platform, price range, city
- Tier pills in toolbar (All / Nano / Micro / Macro / Celeb) — synced with filter drawer
- **Kalakaar cards:** avatar, tier badge, rating pill (gold star), Active/Inactive status, followers, cost, Select/Selected CTA
- Celebrity tier shows "Get In Touch" button → `CelebCallbackModal`
- Default avatar fallback (DiceBear)
- **Bulk select:** "Select top…" dropdown (Top 5 / 10 / 20 / All) → add selected to cart in one click
- Kalakaar count display ("X Kalakaars")
- **Creator profile 404 fix** — Kalakaars who never toggled presence (new accounts) are now accessible from marketplace cards
- **Genre filter fix** — multi-niche Kalakaars correctly appear when filtering by any of their niches (not just the first)

### Cart & Checkout
- Cart context shared across app (single state instance)
- Dedicated `/cart` page (brand-only) — Kalakaar list, campaign create + instructions textarea, **Campaign Brief upload** (PDF/DOC/Images)
- Campaign Brief upload section appears after campaign is created; accepts PDF, DOC, DOCX, Images
- Dedicated `/checkout` page — campaign details, creator list, price breakdown (Kalakaar Subtotal / Platform Fee 8% / GST 18% / Grand Total)
- Razorpay checkout (two-step: create order → verify payment signature, server-side)
- 8% platform fee enforced server-side at order creation — not client-only
- Post-payment success screen with "Browse Kalakaars" and "Your Campaigns" CTAs

### Brand Dashboard
- Campaign list with status badges (no budget/deadline — budget auto-calculated from creator cartPrices)
- **Campaign Influencers panel** — view all creators added to a campaign, filter by payment status (all/paid/pending), search by name, sort by price or followers; computed total budget; remove pending creators
- Proposals table per campaign (accept / reject)
- **Campaign Progress Tracker** — premium 7-stage horizontal timeline per creator (Campaign Created → Creators Notified → Scripts Reviewed → Content Created → Brand Review → Content Delivered → Payment Released); purple glow on active stage, animated track fill, revision badge, relative timestamps; 15s live refresh; accessible at `/brand/campaigns/:id/track`
- **4-Phase Visual Tracker (`CampaignPhaseTracker`)** — condensed brand-facing view mapping 7 internal stages to 4 phases: Creator Selection / Shooting Started / Video Uploaded / Payment Done; used in popover and Previous Campaigns panel
- **Running Campaigns panel** — collapsible campaign cards each with compact 4-phase tracker + per-creator status list; shows leading creator's stage
- **Current Campaign Popover** — compact popup triggered from top-right "Campaigns" button; shows live campaign title, creator count, 4-phase tracker, "Full Tracker" link + "View All" → campaigns tab; 20s auto-refresh
- **Transactions tab** (renamed from History) — full brand-side payment history with filters: by creator, campaign, date range, status; total paid summary card; one-click invoice PDF download per transaction
- **Previous Campaigns panel** — expandable rows per past campaign showing: creator list, deliverable video links, live Instagram/YouTube post URLs (set by creator after going live), per-creator payment rows with invoice download
- **PDF Invoice download** — `GET /api/invoices/:transactionId.pdf` streams a pdfkit-generated A4 invoice with invoice number, brand + creator details, campaign name, amount, Razorpay reference; ownership-checked (brand or creator only)
- Video review grid — approve / request revision
- Campaign file management (brief uploads, contract documents)
- Campaign creation form (title, description, platform, niche, file attachments; brief tooltip with disclaimer)
- Brand Room: saved creators list, campaign start date picker with countdown, active status toggle
- Brand public profile page (`/brand/:id`) — logo, industry, description, open campaign count (no auth required)

### Influencer Dashboard
- **Dashboard = private management only** — presence toggle, edit, settings live on the creator's own profile page (`OwnerActionsBar`); dashboard scoped to analytics overview, wallet, membership, settings tabs only
- Analytics overview: earnings total, pending payouts; **Monthly earnings bar chart** — last 6 months of accepted proposals (recharts via shadcn ChartContainer)
- **Wallet tab** — earnings balance, withdraw drawer (UPI ID input → admin-notified), transaction history table
- **Membership tab** — Silver / Gold tiers with 1-month / 6-month / 12-month duration pricing; Razorpay payment flow; Silver: ₹119/99/79 per month equivalent; Gold: ₹199/149/99 per month equivalent
- Browse open campaigns (`/campaigns`) — filter by genre and platform; linked from creator nav
- Campaign details + proposal submission (bid amount, message, deliverables)
- **OAuth platform connection toasts** — `?ig_connected=1` / `?yt_connected=1` / `?ig_error` / `?yt_error` redirect params handled in dashboard, fires toasts, invalidates `connected-platforms` cache

### Super Admin System (`/admin`, founder-only)
- **Founder badge** — gold "Founder" chip displayed on GlobalHeader dropdown and Admin Dashboard for super admin accounts
- **View Switcher** — Admin/Brand/Creator toggle in header dropdown; super admin can impersonate any role to QA brand or creator flows without logging out; persisted to `localStorage` under `kalakariaan_view_as`
- **Admin Dashboard** — 5 tabs: Overview (6 live stat tiles), Users, Campaigns, Feature Flags, Audit Log
- **Overview tab** — Total Users, Creators, Brands, Campaigns, Verified Creators, Suspended counts (parallel DB queries)
- **Users tab** — search by name/email, filter by role (All/Brands/Creators), per-user actions: force presence online/offline, verify creator, suspend/unsuspend, delete user; Founder badge + Suspended badge inline; super admins show ShieldCheck icon with no destructive actions available
- **Campaigns tab** — all campaigns with status dropdown (open/closed/archived), live status update
- **Feature Flags tab** — toggle 5 platform flags: `maintenance_mode`, `new_registrations`, `marketplace_visible`, `campaign_creation`, `creator_registrations`; changes take effect immediately
- **Audit Log tab** — immutable log of every admin action: actor, action, target type + ID, timestamp
- **Defense-in-depth**: `requireSuperAdmin` middleware does a live DB lookup (not JWT) on every admin request to prevent privilege escalation via token manipulation; `is_super_admin` also synced to Supabase `user_metadata` at login for fast reads
- **Suspension system** — suspended users receive HTTP 403 on all authenticated routes via auth middleware DB check; super admins bypass suspension check
- **Seeded founders** — `masteranhad@gmail.com` + `rishabhverma707@gmail.com` are seeded as super admins via migration 025
- **DB schema** (migration 025): `is_super_admin` + `is_suspended` on `profiles`; `is_verified` on `influencer_profiles`; `admin_audit_logs` table; `feature_flags` table with 5 default rows

### Account Hub (`/account/*`)
- **Google Account–style settings** — unified hub replacing scattered `/profile/edit`, `InfluencerDashboard?tab=settings`, and brand settings pages
- **Sidebar navigation** — Home, Personal Info, Security, Connected Apps (creator only), Data & Privacy, Payments & Subscriptions; sticky on `md+`, collapsible drawer on mobile
- **Personal Info** — creator: name, bio, city/state, IG/YT handles, 25 niches, commercials pricing (6-month lock enforced); brand: name, email, phone, industry
- **Security** — password change, sign-out-all sessions (Supabase global signout), danger zone with account deletion (requires current password + typing `delete`; password verified server-side via `signInWithPassword` before deletion; Google-only accounts skip password check)
- **Connected Apps** (creator only) — `PlatformConnectCard` for Instagram + YouTube; Razorpay read-only linked row
- **Data & Privacy** — marketplace visibility, discoverability, presence visibility, profile visibility toggles; notification preference toggles (campaigns, proposals, messages, payments, marketing); data export request
- **Payments** — creator: `WalletTab` + `MembershipTab`; brand: `BrandTransactionsPanel`
- **Role-aware** — brand and creator see different sections; Super Admin `viewAs` respected throughout
- **Name persistence fix** — profile save now writes name to both `profiles` table and Supabase Auth user metadata, so display name matches registration name (not email-account name)

### Profile System — Kalakaar
- Public Kalakaar profile (`/influencer/:id`) — full-page with:
  - **Profile header** — pencil (→ `/account/personal`) + settings icons visible on own profile; orange rating box; Instagram + YouTube handles always shown (italic "not connected" if absent); `city, state` on own row below social handles
  - **Kalakaar Portfolio** — snap-scroll carousel, multi-file upload (max 12), prev/next arrows, radio-dot indicators, image count overlay; owner-only **Replace** (single image swap at selected index) and **Remove** controls below the selected image
  - **Social Media section** — per-platform IG/YT cards (followers, ER%, price); compact "Select Kalakaar" CTA row
  - **"Select Kalakaar — Choose Platforms"** CTA for brand view (non-celeb only) — scrolls to Social Media section
  - **Analytics section** — engagement rate, avg views, reach estimate, authenticity score
  - **Creator Campaigns** (own profile only) — running vs previous proposals with status badges + invoice placeholder
  - **Wallet modal** (own profile only) — current balance, total earnings, link to transactions
  - **OwnerActionsBar** (own profile only) — online presence toggle (Active / "Offline Xm ago" ticking); Edit profile link; Settings link; Wallet button; Analytics scroll button
- Edit Kalakaar profile (`/profile/edit`) — dark obsidian theme; days-as-Kalakaar counter badge (🔥); email display (read-only); city + state grid; @-handle UI with @ prefix label; 25 niche options; **Commercials** section (IG reel/story + YT video/shorts with ₹ prefix); **profile changes reflect immediately on the public profile page** (query cache invalidated on save)
- **Commercials pricing lock** — pricing inputs are locked (with overlay + unlock date) for the first 6 months from registration; both client and server enforce the 6-month rule (`403` with `unlockAt` from server)
- **Commercials pricing** — `pricing` object with keys `reel | story | video | post | shorts`; 5% platform margin applied on brand-facing reads
- **DB migration 026** — `state TEXT` column on `influencer_profiles`
- **Brand account settings** (`/profile/edit`) — premium obsidian-themed settings page with profile image upload, name, work email, phone, brand category; separate secure password change section
- My profile page — conditional render (brand view / Kalakaar view)
- Profile image upload (pre-signed URL → Supabase Storage)

### Brand → Kalakaar Profile View
- Brands can browse Kalakaar profiles from marketplace cards (`/influencer/:id`)
- Portfolio gallery (carousel) visible to brands
- Social platform panel: IG/YT cards with individual pricing per format
- "Select Kalakaar — Choose Platforms" CTA scrolls to platform selection
- Celeb tier shows "Get In Touch" — no pricing/select shown
- `isCelebTier` guard: select CTA hidden for own-profile, celeb tier, non-brands

### Messaging
- DM conversations between brands and influencers
- Conversation list with last message preview
- Send / receive messages with read status

### Notifications
- Bell icon with unread count badge — dark dropdown (charcoal bg, purple accents)
- Full-page `/notifications` — tab filter (All / Unread), mark all read, delete, click-to-navigate
- Mark individual or all as read

### Social Stats
- Instagram stats: followers, ER, recent posts (live API or mock fallback)
- YouTube stats: subscribers, views, recent videos (live API or mock fallback)
- `GET /api/social/stats/:userId` — combined stats endpoint (reads from `creator_platform_metrics` when available, falls back to mock)

### Creator Platform Integration (Instagram + YouTube OAuth)
- **Unified schema** (`creator_platform_accounts`, `creator_platform_metrics`, `creator_platform_metric_history`) — one row per creator-platform connection; supports IG + YT today, extensible to TikTok/X
- **AES-256-GCM token encryption** at rest — access + refresh tokens encrypted with `TOKEN_ENCRYPTION_KEY` env var; never returned in any API response
- **Instagram OAuth** — Facebook Login + Graph API v20.0, scopes: `instagram_basic, pages_show_list, instagram_manage_insights, pages_read_engagement`. Long-lived 60-day page token. Reach, impressions, audience gender-age + country, engagement rate, top 5 media
- **YouTube OAuth** — Google OAuth2 with auto-refresh; scopes: `youtube.readonly, yt-analytics.readonly`. Channel stats + YT Analytics API (views, demographics, country breakdown). Access token auto-refreshes when <5min remaining
- **Authenticity Score (0-100)** — free heuristic combining reach rate (40%), engagement (30%), audience country diversity (20%), demographic data completeness (10%). Shown as "Audience Authenticity" badge with green/amber/red tiers
- **Sync pipeline** — manual `POST /api/platforms/:platform/sync` button (rate-limited 10/hr/user) + daily Supabase `pg_cron` job at 03:00 UTC hitting `/api/internal/cron/sync-platforms` (header-secret guarded, returns 404 on bad secret to avoid endpoint signaling)
- **Daily history snapshots** — `creator_platform_metric_history` captures follower count + engagement + reach per day for trend charts
- **Frontend** — `PlatformConnectCard` (Connect / Refresh / Disconnect) on Instagram + YouTube tabs of `/influencer/dashboard?tab=analytics`. Real metric cards, audience demographics (gender donut + top 6 countries bar), 30/90-day follower trend line, top 5 content thumbnails, authenticity badge
- **API**: `GET /api/platforms`, `GET /api/platforms/:platform/metrics`, `GET /api/platforms/:platform/auth`, `GET /api/platforms/:platform/callback`, `POST /api/platforms/:platform/sync`, `DELETE /api/platforms/:platform`

### Membership
- Silver and Gold tiers with Razorpay payment flow
- Webhook-based async confirmation (`/api/membership/webhook`)
- Membership badge displayed on influencer cards and profile

### Videos
- Influencer video uploads linked to campaigns
- Brand review flow — approve or request revision with feedback
- **Live post URL** — creator can set the published Instagram/YouTube post URL (`PUT /api/videos/:id/live-url`) after brand approval; visible to brand in Previous Campaigns panel with platform-specific link icons
- Brand view all deliverables per campaign — `GET /api/videos/campaign/:id/all` (brand ownership-checked)

### Feed
- Public influencer feed — recent posts with like functionality

### Infrastructure
- Supabase RLS + search_path hardening (migration 012)
- `celeb` tier enum (migration 013, backfill from legacy `mega`)
- T&C acceptance tracking (migration 014) — role-aware modal gating checkout + membership
- Campaign workflow stages (migration 015)
- Cart orders table (migration 016)
- Creator ratings (migration 017)
- Withdrawal requests table (migration 018) — `pending | processing | paid | failed` statuses
- Super admin RBAC (migration 025) — `is_super_admin`, `is_suspended`, `is_verified` columns; `admin_audit_logs` + `feature_flags` tables; 5 default flags seeded
- Creator state field (migration 026) — `state TEXT` column on `influencer_profiles`
- Invoice numbering + live post URLs (migration 027) — `transactions.invoice_number` (`INV-YYYY-NNNNN` sequence trigger, backfilled); `campaign_videos.live_post_url` + `live_post_platform`; brand-date index on transactions
- Account preferences (migration 028) — privacy flags (`is_discoverable`, `marketplace_visible`, `presence_visible`, `profile_visibility`) on `influencer_profiles` + `brand_profiles`; `notification_prefs jsonb` on `profiles`; `data_export_requests` table; all default `true` so existing rows unaffected
- 5% platform margin applied server-side on all brand-facing reads (`applyPlatformMargin()`)
- Rate limits: auth 20/15 min, OTP 5/hr by phone, campaign create 10/hr, contact POST 5/hr by IP
- CORS allowlist (hardcoded production + `CORS_ORIGINS` env var + Vercel preview pattern)
- Helmet security headers
- Sentry error capture (optional — skipped if `SENTRY_DSN` absent)
- vibe-guard security CI scan on every push to `main`

---

## In Progress / Known Gaps (🔄)

| Feature | Status | What's Missing |
|---|---|---|
| **Creator Platform Integration** | Code shipped, prod blocked on config | Code shipped 2026-05-13 (commit `5f6140a`). To go live: apply migrations 021 + 023, generate `TOKEN_ENCRYPTION_KEY` + `CRON_SECRET`, configure Meta app permissions + Google Cloud OAuth client. Full checklist in [docs/PLAN_2026-05-14.md](./docs/PLAN_2026-05-14.md). |
| **Social handle ownership verification** | Partial | "Verify" button opens profile in new tab (manual check). No automated OAuth-based ownership proof. |
| **WhatsApp OTP** | Conditional | Route and handler exist. Requires `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` env vars. Falls back to mock response without them. |
| **Instagram / YouTube analytics** | Conditional | API wired up with mock fallback. Requires `INSTAGRAM_ACCESS_TOKEN` + `YOUTUBE_API_KEY`. Without keys, mock data is returned. |
| **Real-time messaging** | Poll-based | Messages page polls the API. Supabase Realtime / WebSocket not yet wired. |
| **Creator online status in marketplace** | 60s poll | Marketplace auto-refetches every 60s (`refetchInterval: 60_000`). Deletions reflect on next page refresh (`no-store` cache). For true real-time presence, wire Supabase Realtime on `influencer_profiles.is_online`. |
| **Influencer withdrawal payouts** | Admin-notified only | `POST /api/wallet/withdraw` inserts a `withdrawal_requests` row and emails admin. Actual Razorpay Payouts API not wired — requires manual admin action. |
| **Similar influencers endpoint** | Server wired, needs verification | `GET /api/influencers/:id/similar` exists; confirm Supabase query returns correct tier-matched results in production. |
| **Platform `platforms` column sync** | Partial | Client `connectedPlatforms` is built from `social_handles` (reliable). Server platform filter uses `platforms` array column — can diverge if a creator set handles without setting the column. Client-side fallback filter compensates. |

---

## Roadmap / Next Steps (⏭️)

### Near-term (next session)
- [ ] Wire Supabase Realtime on messages table — eliminate polling
- [ ] Verify `GET /api/influencers/:id/similar` returns correct results in production
- [ ] Wire actual Razorpay Payouts API for influencer withdrawals (currently admin-notification only)
- [ ] Push notifications via FCM/APNs (service worker hook already present in PWA)
- [ ] Social handle OAuth verification (Instagram Basic Display API / YouTube OAuth)

### Platform Enhancements
- [ ] AI-powered creator recommendations (semantic search by brief → matching creators)
- [ ] Influencer verified-badge flow (manual admin approval after follower count check)
- [ ] Advanced filters: engagement rate range, fake-follower % threshold
- [ ] Campaign match score — show fit % per creator for a given brief
- [ ] Escrow / milestone payment hold — release on brand approval
- [x] Automated invoice generation (PDF) on successful payment — `GET /api/invoices/:id.pdf` via pdfkit, linked to transactions + downloadable from brand Transactions tab
- [ ] E-signature for campaign contracts (DocuSign / Leegality API)

### Scale
- [ ] Multi-currency support (USD for global brands)
- [ ] Mobile apps (React Native / Flutter — API is already mobile-ready)
- [ ] Affiliate / referral reward system (referral code infra exists in DB)
- [ ] Bulk brand outreach — brands message multiple creators in one action
- [ ] Content calendar / deadline tracker for creators

---

## Folder Structure

```
kalakaarian/
├── client/                  # React + Vite PWA
│   ├── public/              # static assets, PWA manifest, icons, offline.html
│   └── src/
│       ├── api/             # axios instance (auto-attach JWT, 401 redirect)
│       ├── components/      # 25+ custom components + shadcn/ui primitives
│       │   ├── admin/       # AdminUsersPanel, AdminFlagsPanel (super admin UI)
│       │   └── ui/          # shadcn/ui — DO NOT hand-edit; use CLI to regenerate
│       ├── contexts/        # CartContext (shared cart state across pages)
│       ├── hooks/           # useAuth, useCart, useTheme
│       ├── lib/             # api.ts (typed API client), constants.ts, store.ts
│       ├── pages/           # 30+ pages, one default export each
│       │   └── account/     # Account Hub — 6 section pages + Layout + shared components (Sidebar, MobileSidebarDrawer, SectionHeader, PreferenceToggle)
│
├── server/
│   └── src/                 # ✅ ONLY this folder is deployed to Vercel
│       ├── config/          # Supabase adminClient (service role, bypasses RLS)
│       ├── controllers/     # 14 controller files, ≤200 lines each (accountController added)
│       ├── middleware/       # auth.ts, requireAdmin.ts, validate.ts
│       ├── routes/          # 20 route files (account.ts added)
│       ├── services/        # Instagram, YouTube, Razorpay, Resend, social media
│       ├── types/           # TypeScript interfaces (AuthRequest, etc.)
│       ├── utils/           # pricing.ts (PLATFORM_MARGIN_RATE, PLATFORM_FEE_RATE)
│       └── app.ts           # serverless entrypoint — no app.listen()
│
├── supabase/
│   └── migrations/
│       ├── 011_v1_extras.sql        # transactions, analytics, portfolio tables
│       ├── 012_security_hardening.sql  # search_path on all public functions
│       └── 013_add_celeb_tier.sql   # adds celeb enum, migrates mega → celeb
│
├── docs/                    # API.md, DEPLOYMENT_CHECKLIST.md, CHANGELOG.md
├── .github/workflows/       # security.yml — vibe-guard scan on push to main
├── vercel.json              # server/src/app.ts → serverless fn; all routes → it
└── CLAUDE.md                # contributor rules — read before touching code
```

> `server/controllers/`, `server/models/`, `server/routes/` (no `src/`) are **legacy dead code** from the original MongoDB version. Not deployed. Do not edit.

---

## Setup

### Prerequisites

- Node.js 18+, npm 9+
- Supabase project — [supabase.com](https://supabase.com) (free tier works)
- Vercel CLI — `npm i -g vercel`
- Razorpay account (test mode for local dev)

### 1. Clone & Install

```bash
git clone https://github.com/WickTech/Kalakaarian.git
cd kalakaarian
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

| Variable | Where to get it | Required |
|---|---|---|
| `SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | ✅ |
| `VITE_API_URL` | `http://localhost:4000/api` (local) | ✅ |
| `CORS_ORIGINS` | Comma-separated allowed origins | ✅ (prod) |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth credentials | ✅ |
| `GOOGLE_CLIENT_ID` | Same as above | ✅ |
| `GOOGLE_CLIENT_SECRET` | Same as above | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay dashboard | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks → your endpoint secret | ✅ (payments) |
| `VITE_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` | ✅ |
| `RESEND_API_KEY` | resend.com | ✅ (email) |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` (32-byte base64) | ✅ (platform OAuth) |
| `CRON_SECRET` | `openssl rand -hex 32` — used by pg_cron + internal jobs | ✅ (sync cron) |
| `INSTAGRAM_APP_ID` | Meta for Developers → app dashboard | ✅ (IG OAuth) |
| `INSTAGRAM_APP_SECRET` | Meta for Developers → app dashboard | ✅ (IG OAuth) |
| `INSTAGRAM_CALLBACK_URL` | `https://<server>/api/platforms/instagram/callback` | ✅ (IG OAuth) |
| `YOUTUBE_OAUTH_CLIENT_ID` | Google Cloud Console → OAuth credentials | ✅ (YT OAuth) |
| `YOUTUBE_OAUTH_CLIENT_SECRET` | Google Cloud Console → OAuth credentials | ✅ (YT OAuth) |
| `YOUTUBE_OAUTH_CALLBACK_URL` | `https://<server>/api/platforms/youtube/callback` | ✅ (YT OAuth) |
| `FRONTEND_URL` | `https://kalakaarian.com` (used for OAuth post-callback redirect) | ✅ (OAuth) |
| `SENTRY_DSN` | sentry.io | Optional |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business → WhatsApp | Optional |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business → WhatsApp | Optional |
| `INSTAGRAM_ACCESS_TOKEN` | Meta for Developers (legacy app-level token) | Optional |
| `YOUTUBE_API_KEY` | Google Cloud Console (legacy public read fallback) | Optional |

> Server fail-fasts at boot if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing.

### 3. Database Migrations

Apply in the Supabase SQL editor in order:

```
# First apply v2 base schema (001–010) if starting fresh
# Then apply v1 extras in order:
supabase/migrations/011_v1_extras.sql
supabase/migrations/012_security_hardening.sql
supabase/migrations/013_add_celeb_tier.sql
supabase/migrations/014_terms_accepted.sql
supabase/migrations/015_workflow_stages.sql
supabase/migrations/016_cart_orders.sql
supabase/migrations/017_ratings.sql
supabase/migrations/018_withdrawal_requests.sql
supabase/migrations/019_app_ratings.sql
supabase/migrations/020_instagram_oauth.sql          # superseded by 021 — apply only if rolling back
supabase/migrations/021_creator_platforms.sql        # unified platform schema (IG + YT)
supabase/migrations/023_pgcron_sync_platforms.sql    # daily analytics sync (edit <SERVER_URL> + <CRON_SECRET> first)
supabase/migrations/025_super_admin.sql              # is_super_admin/is_suspended on profiles, feature_flags, admin_audit_logs
supabase/migrations/026_creator_state.sql            # state TEXT column on influencer_profiles
supabase/migrations/027_invoices_and_post_urls.sql   # invoice_number on transactions (sequence trigger) + live_post_url on campaign_videos
supabase/migrations/028_account_preferences.sql      # privacy flags, notification_prefs jsonb, data_export_requests table
```

> Migration 022 (drop legacy IG columns) is intentionally skipped — run it manually after `021` has been on prod for ~1 week and code no longer references the old `influencer_profiles.instagram_*` columns.

> Before applying `023`, enable required Postgres extensions in the Supabase dashboard:
> ```sql
> CREATE EXTENSION IF NOT EXISTS pg_cron;
> CREATE EXTENSION IF NOT EXISTS pg_net;
> ```

### 4. Supabase Auth

1. Dashboard → Authentication → Providers → enable **Email**
2. Enable **Google** → add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
3. Configure SMTP (Dashboard → Auth → SMTP settings) or use Supabase built-in

### 5. Storage Buckets

Create in Supabase Storage:

| Bucket | Max file size | Public |
|---|---|---|
| `avatars` | 5 MB | ✅ |
| `campaign-files` | 10 MB | ✅ |

### 6. Run Locally

```bash
vercel dev        # serves client (port 5173) + serverless API on single origin
```

Frontend-only (point at a deployed API):

```bash
npm run client    # http://localhost:5173
```

---

## Deployment

Both client and server deploy to Vercel automatically on push to `main`.

| Project | Type | Source |
|---|---|---|
| `kalakaarian` (server) | Serverless function | `server/src/app.ts` |
| `kalakaarian-client` (frontend) | Static site | `client/dist/` |

**Deployment checklist:**
1. `cd server && npm run typecheck` — must be clean
2. `cd client && npm run build` — must succeed
3. `cd client && npm run lint` — zero errors
4. Set all env vars in Vercel dashboard for both projects
5. Register Razorpay webhook: `https://<domain>/api/membership/webhook`
6. Set `CORS_ORIGINS` to your production frontend URL(s)
7. Swap Razorpay test keys → live keys before going live

---

## API Reference

See [docs/API.md](./docs/API.md) for the full endpoint list.

**Key contracts:**
- All brand-facing influencer reads include **5% platform margin** — do not re-apply in the frontend
- Pricing stored raw in DB; `applyPlatformMargin()` runs on every brand-facing read
- Platform fee (8%) applied at Razorpay order creation — not client-side
- Auth middleware sets `req.user.userId` + `req.user.role` — use `AuthRequest` type in all protected handlers
- JWT storage key in browser: `kalakariaan_token` (preserve this typo — renaming silently logs everyone out)
- Tier enum: `nano | micro | macro | celeb` — no `mid`, no `mega`
- `PUT /api/auth/password` — verifies `currentPassword` via `signInWithPassword` before updating; requires auth JWT; 400 on wrong current password
- `PUT /api/auth/profile` (brand) — now also accepts `phone` (writes to `profiles.phone`) and `email` (writes to `profiles.email` + syncs Supabase Auth)
- **Platform tokens never leak** — `creator_platform_accounts.access_token_encrypted` is AES-256-GCM encrypted; `sanitize()` in `platformAccountService.ts` strips token columns from every read; no API response includes raw tokens
- **OAuth state CSRF** — both IG + YT use HMAC-SHA256 signed state (`buildOAuthState` / `verifyOAuthState`) with 15-min expiry and `crypto.timingSafeEqual` comparison
- **Cron endpoint** — `POST /api/internal/cron/sync-platforms` returns 404 (not 401) on missing/wrong `X-Cron-Secret` to avoid signaling endpoint existence to unauthenticated probes
- **Token refresh** — YouTube `syncYouTube()` auto-refreshes access token via stored refresh_token when <5min remaining; Instagram (page tokens never expire) flagged with `last_sync_status='token_expired'` when 60-day reconnect is needed, UI shows Reconnect CTA
- **Admin API** — all `/api/admin/*` routes require `auth` + `requireSuperAdmin` (DB-verified middleware, not JWT-only); key endpoints:
  - `GET /api/admin/stats` — 6 aggregate counts
  - `GET /api/admin/users` — paginated user list (params: `role`, `suspended`, `search`)
  - `PUT /api/admin/users/:id/suspend` — toggle suspension; 403 on self or other super admins
  - `PUT /api/admin/users/:id/verify` — mark creator verified
  - `PUT /api/admin/users/:id/presence` — force online/offline
  - `DELETE /api/admin/users/:id` — hard delete (cannot delete super admins)
  - `GET /api/admin/flags`, `PUT /api/admin/flags/:key` — feature flag read + toggle
  - `GET /api/admin/audit-logs` — full audit trail
- **Audit logging** — `logAdminAction(adminId, action, targetType, targetId, details, ip)` writes to `admin_audit_logs` on every admin mutation; includes admin email join via `profiles`
- **Account API** — all `/api/account/*` routes require auth JWT:
  - `POST /api/account/sign-out-all` — invalidates all sessions for the current user via Supabase global signout
  - `GET /api/account/preferences` — returns notification prefs + privacy flags from `profiles` / `influencer_profiles`
  - `PUT /api/account/preferences` — updates prefs (keys validated against `ALLOWED_NOTIF_KEYS` + `ALLOWED_VISIBILITY` whitelists)
  - `POST /api/account/data-export` — inserts `data_export_requests` row (rate-limited: one pending request at a time) + emails admin alert

---

## Docs

| Doc | Contents |
|---|---|
| [docs/API.md](./docs/API.md) | Full API endpoint reference |
| [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) | Step-by-step deploy guide |
| [docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md) | Google OAuth config |
| [docs/SECURITY_REVIEW.md](./docs/SECURITY_REVIEW.md) | Security audit findings |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Version history |
| [CLAUDE.md](./CLAUDE.md) | Agent / contributor rules (read first) |

---

## License

MIT
