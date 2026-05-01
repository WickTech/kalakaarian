# Kalakaarian — India's AI-Powered Influencer Marketplace


Connect brands with creators. Discover authentic partnerships that drive real campaign results.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query v5 |
| Backend | Express 4 + TypeScript — deployed as Vercel serverless via `serverless-http` |
| Database / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Razorpay (two-step order + verify) |
| Email | Resend |
| Monitoring | Sentry (client + server) |

**Deploy cost:** $0/month — Vercel free tier + Supabase free tier.

---

## Project Structure

```
kalakaarian/
├── client/                  # React + Vite PWA
│   ├── public/              # static assets (logo, PWA manifest, offline.html)
│   ├── src/
│   │   ├── api/             # axios instance (auth header + 401 handling)
│   │   ├── components/      # shared UI components + shadcn/ui primitives
│   │   ├── hooks/           # useAuth, useCart, useTheme, …
│   │   ├── lib/             # api.ts (typed API calls), constants.ts, store.ts
│   │   └── pages/           # one file per route
│   └── CLAUDE.md
├── server/
│   └── src/                 # ✅ only this folder is deployed to Vercel
│       ├── config/          # Supabase client (service role)
│       ├── controllers/     # route handlers (≤200 lines each)
│       ├── middleware/       # auth, admin guard, error handler, validate
│       ├── routes/          # API routes
│       ├── services/        # Razorpay, Resend, Instagram, YouTube, referral rewards
│       ├── utils/           # pricing.ts, jwt.ts
│       └── app.ts           # serverless entrypoint — no app.listen
├── supabase/
│   └── migrations/          # 011_v1_extras.sql (apply after v2 001–010)
├── docs/                    # API.md, PRD, deployment guides, changelogs
├── vercel.json              # build config — server/src → serverless fn, client/dist → static
└── CLAUDE.md                # repo-wide rules (read before touching code)
```

> `server/controllers/`, `server/models/`, `server/routes/` (no `src/`) are **dead legacy MongoDB code** — not deployed, do not edit.

---

## Quick Start

### Prerequisites

- Node.js 18+, npm 9+
- Supabase project (create free at [supabase.com](https://supabase.com))
- Vercel CLI (`npm i -g vercel`)

### 1. Clone & Install

```bash
git clone https://github.com/WickTech/Kalakaarian.git
cd kalakaarian
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in all values — server fail-fasts on missing SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

Key variables:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `VITE_API_URL` | `http://localhost:4000/api` for local dev |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth credentials |
| `GOOGLE_CLIENT_ID` | Same as above |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay dashboard |
| `RESEND_API_KEY` | resend.com |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### 3. Apply Database Migrations

```bash
# In Supabase SQL editor, run in order:
# 1. Apply v2 base schema migrations 001–010 (from kalakaarian-v2 repo)
# 2. Then apply:
supabase/migrations/011_v1_extras.sql
```

### 4. Supabase Auth Setup

1. Enable **Email** provider (Supabase dashboard → Authentication → Providers)
2. Enable **Google** provider — add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
3. Configure SMTP for email OTP (or use Supabase's built-in)

### 5. Storage Buckets

Create two buckets in Supabase Storage:

| Bucket | Max size | Public |
|---|---|---|
| `avatars` | 5 MB | ✅ |
| `campaign-files` | 10 MB | ✅ |

### 6. Run Locally

```bash
vercel dev        # serves client (5173) + serverless API on single origin
```

Or for frontend-only iteration:

```bash
npm run client    # http://localhost:5173 — point VITE_API_URL at a deployed preview
```

---

## Current State (as of 1 May 2026)

### ✅ Shipped

**Auth & Onboarding**
- Brand registration — company name, industry, Indian state, confirm password
- Influencer registration — 5-step wizard (basic info → genre → platforms → rates → location), Indian states dropdown, confirm password
- Login — email/password + Google OAuth + phone OTP
- Direct routing: Landing → Brand Register / Influencer Register (no intermediate role-select screen)
- 5% platform margin applied server-side on all brand-facing pricing reads (hidden from influencers)

**Landing & Marketing**
- Hero section with gradient, tier count grid (Nano / Micro / Macro / Celebrity), "Why Kalakaarian" features
- Contact page, Terms, Refund Policy, Privacy Policy
- Footer with correct legal links

**Marketplace**
- Influencer cards with tier badges, presence indicator (green dot / last seen)
- Filters: price range, tier, genre, platform, city, gender — in collapsible side drawer
- Social media platform toggle (right side)
- Select All / Deselect All with bulk "Add to Cart"
- Banner / ads strip (placeholder — ready for real ad data)

**Cart & Checkout**
- Cart drawer with 8% platform fee line item + grand total
- Razorpay two-step checkout (create order → verify payment)
- Membership tiers: Silver / Gold with Razorpay webhook for async confirmation

**Dashboards**
- Brand dashboard — campaign overview, proposal management
- Influencer dashboard — profile stats, active proposals, campaign browse
- Profile editing (brand + influencer)
- Messages

**Platform**
- Referral system + Gold auto-grant (10 referred Gold buyers → free 1-year Gold for referrer)
- Email notifications — welcome, OTP, membership invoice, proposal status (Resend)
- Feed page
- Sentry error monitoring (client + server)

---

### 🔴 Known Bugs (fix before launch)

| # | Bug | File | Severity |
|---|---|---|---|
| 1 | `localStorage.getItem("token")` — wrong key, should be `"kalakariaan_token"` | `client/src/lib/api.ts:260` | Critical |
| 2 | Google login sends `{ jwtToken }`, server expects `{ token }` | `client/src/lib/api.ts:409` | Critical |
| 3 | Navbar "Join as Creator" routes to `/login`, should be `/influencer-register` | `client/src/components/Navbar.tsx:80` | Medium |
| 4 | 8% platform fee only enforced client-side — no server validation at checkout | `server/src/controllers/cartController.ts` | High |

---

### 🔲 What's Next

**Blocking for launch:**
- [ ] Fix bugs #1–#4 above
- [ ] Create Supabase project + apply migrations 001–010, then 011
- [ ] Enable Google + Email auth providers in Supabase dashboard
- [ ] Create `avatars` + `campaign-files` storage buckets
- [ ] Deploy to Vercel — set all env vars in dashboard
- [ ] Register Razorpay webhook URL: `https://<domain>/api/membership/webhook`
- [ ] Swap Razorpay test keys → live keys
- [ ] Set `CORS_ORIGINS` to production domain(s)
- [ ] Run pre-ship checklist: `typecheck` + `build` + `lint` + `test` all green

**Post-launch:**
- [ ] Server-side 8% fee enforcement at Razorpay order creation
- [ ] Real ad/banner API integration in marketplace
- [ ] Escrow / milestone-based payment holding
- [ ] In-app real-time messaging (WebSocket / Supabase Realtime)
- [ ] Push notifications (FCM / APNs)
- [ ] Full analytics dashboard UI
- [ ] Influencer verified-badge flow
- [ ] AI-powered creator recommendations

---

## API Reference

See [docs/API.md](./docs/API.md) for the full endpoint list.

Key contracts:
- All brand-facing influencer reads include **5% platform margin** — do not re-apply in the frontend
- Pricing stored raw in DB (`influencer_pricing` table); `applyPlatformMargin()` runs on every read
- Auth middleware sets `req.user.userId` + `req.user.role` — use `AuthRequest` type in all protected handlers
- JWT storage key in browser localStorage: `kalakariaan_token` (preserve this typo — renaming logs everyone out)

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
