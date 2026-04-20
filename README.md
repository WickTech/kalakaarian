# Kalakariaan - D2C Influencer Marketplace

A Direct-to-Consumer (D2C) influencer marketplace connecting brands with micro-influencers for authentic marketing campaigns.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript (Vercel serverless via `serverless-http`) |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt + Google OAuth + WhatsApp OTP |
| Container | Docker + Docker Compose (optional, Atlas-friendly without it) |

## Deployment

| Service | Platform | Cost |
|---------|----------|------|
| Frontend (`client/`) | [Vercel](./docs/VERCEL.md) | Free |
| Backend (`server/src/`) | Vercel serverless function (same project) | Free tier |
| Database | [MongoDB Atlas](./docs/MONGODB.md) | Free (M0) |

**Total MVP Cost:** $0/month (within free tiers).

> The backend is **not** a long-running Node process. `vercel.json` builds `server/src/app.ts` with `@vercel/node`.

## Project Structure

```
kalakaarian/
├── client/                  # React + Vite frontend (workspace)
│   ├── src/api/             # axios instance + per-resource API calls
│   ├── src/components/      # UI components (incl. shadcn/ui in components/ui)
│   ├── src/hooks/           # custom hooks
│   ├── src/lib/             # api types, store, utils
│   ├── src/pages/           # route pages
│   └── CLAUDE.md            # frontend dev rules
├── server/                  # Express API (workspace)
│   ├── src/                 # ✅ deployed sources
│   │   ├── config/          # database connection
│   │   ├── controllers/     # route handlers
│   │   ├── middleware/      # auth, validation, admin guards
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # external integrations (instagram, youtube, referral)
│   │   ├── utils/           # pricing, jwt, helpers
│   │   └── app.ts           # serverless entrypoint (no app.listen)
│   ├── controllers/, models/, routes/, utils/   ⚠️ legacy, NOT deployed
│   └── CLAUDE.md            # backend dev rules
├── packages/models/         # shared types (workspace)
├── infra/                   # nginx config
├── docs/                    # PRD, API docs, deployment guides
├── vercel.json              # single-build serverless config
├── docker-compose.yml       # optional local stack
└── CLAUDE.md                # repo-wide agent rules (read first)
```

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local) or Atlas |

### 1. Clone & Install

```bash
git clone https://github.com/WickTech/kalakaarian.git
cd kalakaarian
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (full template lives at .env.example)
```

The server fail-fasts on boot if any of these are missing: `JWT_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`. See `.env.example` for the complete list and Vite (`VITE_*`) keys.

### 3. Start Development

The backend is a **Vercel serverless function**, not a long-running Node server (no `app.listen`). Pick one of:

**Option A: Vercel CLI (closest to production)**
```bash
npm i -g vercel
cd kalakaarian
vercel dev          # serves both client (5173) and the serverless API on one origin
```

**Option B: Workspace dev (faster iteration on the UI)**
```bash
# from repo root
npm install
npm run client      # http://localhost:5173 (Vite)
# point VITE_API_URL at a deployed preview, or run `vercel dev` in a second terminal
```

**Option C: Docker (optional MongoDB only)**
```bash
docker-compose up -d mongo   # spins up MongoDB at localhost:27017
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend (via `vercel dev`) | http://localhost:3000/api |
| MongoDB (local) | mongodb://localhost:27017 |

### 5. Google OAuth Setup

Follow the [Google OAuth Setup Guide](./docs/GOOGLE_OAUTH_SETUP.md) to:
1. Create Google Cloud project
2. Enable OAuth API
3. Get credentials
4. Configure redirect URIs

## Deployment Guide

1. **[MongoDB Atlas Setup](./docs/MONGODB.md)** — Create free M0 cluster
2. **[Vercel Deploy](./docs/VERCEL.md)** — Both frontend and serverless backend deploy from the same Vercel project (see `vercel.json`)
3. **[Google OAuth Setup](./docs/GOOGLE_OAUTH_SETUP.md)** — Configure Google Login
4. Set env vars in Vercel dashboard (see table above); the server fail-fasts on missing `JWT_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`

## Launch Status — target 1 May 2026

### Shipped
- [x] User registration (Brand / Influencer roles)
- [x] JWT auth + Google OAuth + WhatsApp OTP + Email OTP (Resend fallback)
- [x] Influencer marketplace — tier, city, genre, platform, gender filters (all server-side)
- [x] Influencer presence indicator (`isOnline` / `lastSeenAt`, green dot on cards)
- [x] Campaign CRUD + open-listing browse
- [x] Proposal workflow — submit, respond (accept/reject), status emails
- [x] Cart system
- [x] Membership tiers (Silver / Gold) with Razorpay two-step checkout
- [x] Razorpay webhook (`POST /api/membership/webhook`) for async payment confirmation
- [x] Referral system + Gold auto-grant reward (10 referred Gold buyers → free 1-year Gold)
- [x] Email notifications — OTP, welcome, membership invoice, proposal status (Resend)
- [x] File upload via Cloudflare R2 presigned URLs
- [x] Platform 5% margin applied on all brand-facing pricing reads
- [x] Social media stats (Instagram + YouTube, with mock fallback)
- [x] Error monitoring — Sentry (client + server)
- [x] Product analytics — PostHog
- [x] Admin contact form management (rate-limited public POST, admin-only reads)
- [x] Real-time notifications route
- [x] WhatsApp messaging integration

### Remaining before 1 May
- [ ] **Env vars** — add all new keys to `.env.example` and Vercel dashboard (see table below)
- [ ] **`CORS_ORIGINS`** — set to production domain(s) in Vercel env
- [ ] **Razorpay webhook URL** — register `https://<prod-domain>/api/membership/webhook` in Razorpay dashboard; copy secret to `RAZORPAY_WEBHOOK_SECRET`
- [ ] **Razorpay test → live** — swap `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to live-mode keys
- [ ] **Pre-ship checks** — `typecheck` + `build` + `lint` + `test` all green (see `docs/SHIP_CHECKLIST.md`)
- [ ] **Vercel preview smoke test** — health, register, influencer list with gender filter, contact rate-limit, Gold membership purchase
- [ ] **MongoDB Atlas capacity** — confirm cluster tier is sufficient for expected launch load

### Post-launch (not blocking)
- [ ] Escrow / milestone-based payment holding
- [ ] In-app real-time messaging (WebSocket / Pusher)
- [ ] Full analytics dashboard UI
- [ ] Push notifications (FCM / APNs)
- [ ] Influencer verified-badge flow

### New env vars to add (added since initial deploy)

| Variable | Used by | Required |
|---|---|---|
| `VITE_SENTRY_DSN` | Client Sentry | No |
| `SENTRY_DSN` | Server Sentry | No |
| `VITE_POSTHOG_KEY` | PostHog analytics | No |
| `VITE_POSTHOG_HOST` | PostHog analytics | No |
| `RESEND_API_KEY` | Email service | No (silent if absent) |
| `RESEND_FROM` | Email from address | No |
| `RAZORPAY_KEY_ID` | Payments | No (dev bypass if absent) |
| `RAZORPAY_KEY_SECRET` | Payments | No |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification | No |
| `R2_ACCOUNT_ID` | File upload | No (returns 503 if absent) |
| `R2_ACCESS_KEY_ID` | File upload | No |
| `R2_SECRET_ACCESS_KEY` | File upload | No |
| `R2_BUCKET` | File upload | No |
| `R2_PUBLIC_URL` | File upload | No |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/profile` | Get user profile |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/open` | List open campaigns (public) |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Proposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:id/proposals` | Submit proposal |
| GET | `/api/campaigns/:id/proposals` | Get campaign proposals |
| GET | `/api/proposals/my` | My proposals |
| PUT | `/api/proposals/:id/status` | Update proposal status |

### Influencers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/influencers` | List influencers (filters: `tier`, `city`, `genre`, `platform`, `gender`, `page`, `limit`) |
| GET | `/api/influencers/search` | Full-text search with same filters + `q` |
| GET | `/api/influencers/:id` | Get influencer (pricing already includes 5% margin) |
| PUT | `/api/influencers/profile` | Update own profile (influencer only) |
| PUT | `/api/influencers/presence` | Heartbeat — set `isOnline` + `lastSeenAt` |
| PUT | `/api/influencers/:id/image` | Upload profile image |
| POST | `/api/influencers/connect-social` | Link Instagram / YouTube handle |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/add` | Add to cart |
| DELETE | `/api/cart/remove/:id` | Remove from cart |

### Membership & Referrals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/membership/order` | Create Razorpay order (step 1 of checkout) |
| POST | `/api/membership/purchase` | Verify payment + activate membership (step 2) |
| POST | `/api/membership/webhook` | Razorpay async webhook (raw body, no auth) |
| GET | `/api/membership/status` | Get current membership |
| PUT | `/api/membership/cancel` | Disable auto-renew |
| POST | `/api/referrals/generate` | Generate this user's referral code |
| POST | `/api/referrals/use` | Apply a referral code at signup |
| GET | `/api/referrals/stats` | Counts + Gold-unlock progress |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/presign` | Get presigned R2 PUT URL for direct browser upload |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Public contact form (rate-limited 5/hr/IP) |
| GET | `/api/contact` | Admin only — list submissions |
| PUT | `/api/contact/:id/status` | Admin only — mark resolved |

See [docs/API.md](./docs/API.md) for full documentation.

## Environment Variables

See [.env.example](./.env.example) for all variables.

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines.

## License

MIT
# trigger redeploy
