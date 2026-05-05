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

### Marketplace
- 4-column influencer grid (responsive: 2 → 3 → 4 columns)
- Rising Stars carousel — top creators by follower count
- Search bar (name/handle filter, live)
- Filter drawer: tier, genre, gender, platform, price range, city
- Influencer cards: avatar, tier badge, online status dot / last-seen, follower count, cost, add-to-cart
- Default avatar fallback (DiceBear)
- Select all / deselect all with bulk cart add
- Cart drawer: shows selected creators, remove button, 8% platform fee, grand total

### Cart & Checkout
- Cart context shared across app (single state instance)
- Campaign selector inside cart (existing campaigns dropdown or create new name inline)
- Campaign description textarea
- Dedicated `/checkout` page — campaign details, creator list, price breakdown
- Razorpay checkout (two-step: create order → verify payment signature, server-side)
- 8% platform fee enforced server-side at order creation — not client-only

### Brand Dashboard
- Campaign list with status badges
- Proposals table per campaign (accept / reject)
- Campaign workflow timeline (creators selected → content review → payment)
- Video review grid — approve / request revision
- Campaign file management (brief uploads, contract documents)
- Campaign creation form (title, description, budget, deadline, platform, niche, file attachments)

### Influencer Dashboard
- Active proposals list with status
- Analytics cards: engagement rate, avg views, CPV, fake follower %
- Membership tier badge (Silver / Gold)
- Browse open campaigns — filter by genre and platform
- Campaign details + proposal submission (bid amount, message, deliverables)

### Admin Dashboard (`/admin`, admin-only)
- Users tab — paginated user list with role, tier, join date
- Campaigns tab — all campaigns; dropdown to update status (active / paused / completed)

### Profile System
- Public influencer profile (`/influencer/:id`) — bio, followers, ER, social handles, pricing
- Edit influencer profile — genres, platforms, pricing by format, location, bio, profile image
- Edit brand profile — company name, industry, description, location
- My profile page — conditional render (brand view / influencer view)
- Profile image upload (pre-signed URL → Supabase Storage)

### Messaging
- DM conversations between brands and influencers
- Conversation list with last message preview
- Send / receive messages with read status

### Notifications
- Bell icon with unread count badge
- Notification dropdown
- Mark individual or all as read; delete

### Social Stats
- Instagram stats: followers, ER, recent posts (live API or mock fallback)
- YouTube stats: subscribers, views, recent videos (live API or mock fallback)
- `GET /api/social/stats/:userId` — combined stats endpoint

### Membership
- Silver and Gold tiers with Razorpay payment flow
- Webhook-based async confirmation (`/api/membership/webhook`)
- Membership badge displayed on influencer cards and profile

### Videos
- Influencer video uploads linked to campaigns
- Brand review flow — approve or request revision with feedback

### Feed
- Public influencer feed — recent posts with like functionality

### Infrastructure
- Supabase RLS + search_path hardening (migration 012)
- `celeb` tier enum (migration 013, backfill from legacy `mega`)
- 5% platform margin applied server-side on all brand-facing reads (`applyPlatformMargin()`)
- Rate limits: auth 20/15 min, OTP 5/hr by phone, campaign create 10/hr, contact POST 5/hr by IP
- CORS allowlist (hardcoded production + `CORS_ORIGINS` env var + Vercel preview pattern)
- Helmet security headers
- Sentry error capture (optional — skipped if `SENTRY_DSN` absent)
- vibe-guard security CI scan on every push to `main`

---

## In Progress (🔄)

| Feature | Status | What's Missing |
|---|---|---|
| **Social handle ownership verification** | Partial | "Verify" button opens profile in new tab (manual check). No automated OAuth-based ownership proof. |
| **WhatsApp OTP** | Conditional | Route and handler exist. Requires `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` env vars. Falls back to mock response without them. |
| **Instagram / YouTube analytics** | Conditional | API wired up with mock fallback. Requires `INSTAGRAM_ACCESS_TOKEN` + `YOUTUBE_API_KEY`. Without keys, mock data is returned. |
| **Real-time messaging** | Poll-based | Messages page polls the API. Supabase Realtime / WebSocket not yet wired. |
| **BrandCampaignPage** | Placeholder | `/brand-campaign` route exists but renders minimal content; v2 feature not implemented. |

---

## Roadmap / Next Steps (⏭️)

### Phase 1 — Infrastructure & Real-time
- [ ] Wire Supabase Realtime on messages table — eliminate polling
- [ ] Push notifications via FCM/APNs (service worker hook already present in PWA)
- [ ] Social handle OAuth verification (Instagram Basic Display API / YouTube OAuth)

### Phase 2 — Marketplace Enhancements
- [ ] AI-powered creator recommendations (semantic search by brief → matching creators)
- [ ] Influencer verified-badge flow (manual admin approval after follower count check)
- [ ] Advanced filters: engagement rate range, fake-follower % threshold
- [ ] Campaign match score — show fit % per creator for a given brief

### Phase 3 — Payments & Contracts
- [ ] Escrow / milestone payment hold — release on brand approval
- [ ] Automated invoice generation (PDF) on successful payment
- [ ] E-signature for campaign contracts (DocuSign / Leegality API)
- [ ] Payout flow for influencers (Razorpay Payouts / UPI)

### Phase 4 — Analytics & Reporting
- [ ] Campaign performance dashboard (impressions, clicks, conversions, ROI)
- [ ] Brand spend analytics — historical campaigns, ROI trends
- [ ] Influencer growth tracking — follower count history, ER trend chart

### Phase 5 — Creator Tools
- [ ] Content calendar / deadline tracker
- [ ] Draft content upload for brand review before going live
- [ ] Portfolio section — past brand collaborations

### Phase 6 — Platform & Scale
- [ ] Multi-currency support (USD for global brands)
- [ ] Mobile apps (React Native / Flutter — API is already mobile-ready)
- [ ] Affiliate / referral reward system (referral code infra exists in DB)
- [ ] Bulk brand outreach — brands message multiple creators in one action

---

## Folder Structure

```
kalakaarian/
├── client/                  # React + Vite PWA
│   ├── public/              # static assets, PWA manifest, icons, offline.html
│   └── src/
│       ├── api/             # axios instance (auto-attach JWT, 401 redirect)
│       ├── components/      # 22 custom components + shadcn/ui primitives
│       │   └── ui/          # shadcn/ui — DO NOT hand-edit; use CLI to regenerate
│       ├── contexts/        # CartContext (shared cart state across pages)
│       ├── hooks/           # useAuth, useCart, useTheme
│       ├── lib/             # api.ts (typed API client), constants.ts, store.ts
│       └── pages/           # 27 pages, one default export each
│
├── server/
│   └── src/                 # ✅ ONLY this folder is deployed to Vercel
│       ├── config/          # Supabase adminClient (service role, bypasses RLS)
│       ├── controllers/     # 8 controller files, ≤200 lines each
│       ├── middleware/       # auth.ts, requireAdmin.ts, validate.ts
│       ├── routes/          # 18 route files
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
| `SENTRY_DSN` | sentry.io | Optional |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business → WhatsApp | Optional |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business → WhatsApp | Optional |
| `INSTAGRAM_ACCESS_TOKEN` | Meta for Developers | Optional |
| `YOUTUBE_API_KEY` | Google Cloud Console | Optional |

> Server fail-fasts at boot if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing.

### 3. Database Migrations

Apply in the Supabase SQL editor in order:

```
# First apply v2 base schema (001–010) if starting fresh
# Then apply v1 extras:
supabase/migrations/011_v1_extras.sql
supabase/migrations/012_security_hardening.sql
supabase/migrations/013_add_celeb_tier.sql
```

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
