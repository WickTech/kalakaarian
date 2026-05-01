# Kalakaarian — PRD v1 (Launch Scope)

> Version: 1.0 (launch). Date: 2026-04-25. Owner: Rishi.
> This is the canonical scope for the 2026-05-01 launch. Anything not in this doc is out of scope for v1.

## 1. Problem

Indian brands (D2C, local SMBs, agencies) struggle to find, vet, price, and pay nano/micro influencers. Discovery happens on Instagram DMs; price is opaque; trust is low; payments are off-platform; no recourse on missed deliverables.

Indian creators (10k–500k followers) get ad-hoc DMs, no leverage on pricing, get ghosted, and chase payments.

## 2. Solution (v1)

Kalakaarian is an **influencer marketplace PWA** for India that:
1. Lets influencers list themselves with verified social handles, niches, tier, gender, city, and per-deliverable pricing.
2. Lets brands post campaigns with budget/deliverables/deadline.
3. Routes proposals (bid + message + timeline) between the two with platform-managed pricing (5% margin).
4. Provides in-app messaging once a relationship is established.
5. Tracks campaign workflow stages from briefing → delivery → payment.
6. Monetizes via influencer Gold/Silver memberships (priority placement, more pitches, advanced analytics).

## 3. Non-goals for v1

- Real-time chat (polling is fine; Realtime in v2)
- Automated payouts (manual via Razorpay dashboard for v1)
- Mobile native apps (PWA only)
- Hindi UI (English only at launch; Hindi in sprint 2)
- Atlas Search / fancy ranking (composite sort only)
- Refund automation (manual ops)
- Influencer auctions / bidding wars (just first-come proposals)
- Multi-tenant agencies (single influencer per profile)

## 4. Personas

**Brand Bharti** — D2C brand marketer, age 26–35, English+Hindi, Mumbai/Bangalore/Delhi. Budget ₹10k–₹2L per campaign. KPI: cost per qualified lead, content quality.

**Creator Karan** — micro-influencer (10k–100k IG followers), age 18–28, fashion/food/travel/fitness, 2–3 paid collabs/month, English+Hindi. KPI: monthly earnings, brand quality, payment reliability.

**Admin Anita** — Kalakaarian ops (you, Rishi). Reviews reports, handles refunds, verifies handles, runs campaigns.

## 5. Core user journeys

### 5.1 Brand: post → hire → pay

1. Brand signs up (email/Google) → role select → brand profile (company, industry, website).
2. Brand creates a campaign: title, brief, deliverables (e.g. "1 reel + 2 stories"), platforms, budget, deadline.
3. Campaign goes to `open` status; visible at `/browse-campaigns` for influencers.
4. Brand reviews proposals (filter by tier/price/match), opens chat with selected influencer.
5. Brand accepts a proposal → campaign moves to `in_progress`. Influencer is notified.
6. Influencer uploads deliverable → brand reviews → marks `accepted`.
7. Brand triggers payment: Razorpay checkout → membership/campaign payment → admin manually disburses payout (v1 manual).

### 5.2 Influencer: signup → list → pitch → deliver → get paid

1. Influencer signs up (email/Google/phone-OTP) → role select → fills profile (bio, city, gender, niches, tier, social handles, pricing per deliverable, portfolio).
2. Connects Instagram / YouTube handle (mock fallback in dev; real API in prod).
3. Browses open campaigns matching niche/tier; submits proposal with bid + message + timeline.
4. Brand chats; if accepted, influencer creates content, uploads to campaign workflow.
5. Marks delivery complete; awaits brand acceptance.
6. Optionally upgrades to Gold/Silver via Razorpay for priority + perks.

### 5.3 Admin

1. Logs in with admin flag.
2. Reviews `/api/contact` queries.
3. Handles reports (P1-8 to ship before launch).
4. Triggers manual payouts in Razorpay dashboard against a `Transaction` log.

## 6. Feature list (v1 launch)

| # | Feature | Status | Owner |
|---|---|---|---|
| F1 | Email/Google/phone-OTP auth (with attempt lockout) | ⚠️ partial — fix P0-1 | backend |
| F2 | Role selection + brand/influencer registration | ✅ | — |
| F3 | Influencer profile (bio, city, gender, niches, pricing, portfolio) | ✅ | — |
| F4 | Social handle connect (IG, YT) — mock + real | ✅ | — |
| F5 | Campaign create/edit/delete + open listing | ✅ | — |
| F6 | Proposal submit with bid + message + timeline | ✅ | — |
| F7 | Search / filter influencers (tier, city, niche, platform, gender, online) | ⚠️ ranking weak — P1-7 | backend |
| F8 | In-app messaging (gated by relationship) | ⚠️ — P0-4 | backend |
| F9 | Campaign workflow + deliverable accept | ⚠️ accept missing — P1-9 | backend+frontend |
| F10 | Razorpay membership purchase (Gold/Silver) | ⚠️ — P0-2, P0-3, P1-5, P1-6 | backend |
| F11 | Referral Gold reward auto-grant | ✅ | — |
| F12 | Report user / content | ❌ — P1-8 | backend+frontend |
| F13 | Contact form (admin-managed) | ✅ | — |
| F14 | PWA install (manifest, SW, offline) | ⚠️ verify — P1-10 | frontend |
| F15 | Sentry server + client | ⚠️ client missing — P1-11 | frontend |
| F16 | PostHog product analytics | ❌ — P1-1 | frontend |
| F17 | Privacy / Terms / DPDP consent | ❌ — Apr 29 | content+frontend |

## 7. Pricing & monetization (v1)

| Tier | Price (paise) | Display | Duration | Perks |
|---|---|---|---|---|
| Regular | 0 | Free | — | List, pitch, get paid |
| Silver | 49,900 | ₹499 | 30 days | Priority listing within tier, advanced analytics |
| Gold | 99,900 | ₹999 | 30 days | Top placement, unlimited pitches, badge, referral rewards |

Platform takes 5% margin on brand-facing pricing reads (transparent to brand, opaque to influencer; CLAUDE.md confirms).

## 8. Success metrics for launch

See `METRICS.md` for full tree. Headline:

| Metric | 7-day target post-launch | 30-day target |
|---|---|---|
| Activated influencers (profile + 1 social handle connected) | 100 | 1,000 |
| Activated brands (1 campaign posted) | 20 | 150 |
| Proposals submitted | 200 | 2,000 |
| Accepted proposals (matched) | 30 | 300 |
| Paid memberships | 5 | 50 |
| GMV (sum of accepted proposal `bidAmount`) | ₹50k | ₹5L |
| Crash-free sessions | ≥ 99.5% | ≥ 99.8% |
| p95 API latency | ≤ 800ms | ≤ 500ms |

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Cold-start (no influencers, brands won't sign) | Pre-seed 200 mock influencer profiles (real handles, contact for confirmation post-launch). Pre-onboard 10 brand pilots from existing network. |
| Razorpay KYC delay | Backup payment provider (Cashfree) optional v2. v1: keep memberships free for first week if KYC blocks. |
| WhatsApp business API not approved | Email OTP fallback already wired (`sendOtpEmail`). |
| Instagram Graph API rate limits | Mock fallback already in place; use real API only for verified pilot accounts. |
| Vercel serverless cold starts | Acceptable for MVP; monitor p95. Mitigation v2: fly.io or persistent Node. |

## 10. Out-of-scope for v1 (commit to v2)

- Auctions / counter-offers
- Group campaigns (multiple influencers per campaign)
- Long-form briefs with attachments and reference reels
- Brand verification badge
- Automated payout to influencer bank account via Razorpay Payouts
- Influencer rate cards by month
- Niche-specific landing pages (SEO)
- Recommendations / "you might like"
- Analytics for brands (campaign reach, ROI)
- Hindi UI

## 11. Open questions (resolve before Apr 28)

1. GST: are we registered? If not, we cannot legally collect GST — defer paid memberships or use Razorpay's payment-aggregator rails which handle invoicing.
2. Razorpay account: live mode keys procured? KYC status?
3. WhatsApp Business API: applied for / approved? If pending, OTP via SMS gateway (Twilio India ~₹0.50/msg) or email-only at launch.
4. Domain: is `kalakaarian.com` SSL set up? Vercel custom domain bound?
5. Privacy Policy / Terms: legal review done? DPDP applies from 2025; consent banner needed.

---

## Appendix A — Information architecture

```
/                     Landing
/login                Email/Google/phone login
/role-select          New users: brand vs influencer
/brand/register       Brand signup form
/influencer/register  Influencer signup form
/marketplace          Browse influencers (default home for brands)
/influencer/:id       Influencer public profile
/profile              My profile (role-aware)
/profile/edit         Edit profile (role-aware)
/dashboard            Role-redirect → /brand/dashboard or /influencer/dashboard
/brand/dashboard      Active campaigns, proposals, messages
/influencer/dashboard Earnings, active proposals, membership
/create-campaign      Brand-only
/browse-campaigns     Influencer-only
/campaign/:id         Campaign details (brand: edit; influencer: pitch)
/submit-proposal/:id  Influencer pitch flow
/messages             Conversation list + thread
/feed                 Social feed (read-only IG/YT pulls)
/contact              Contact form
/privacy              Privacy policy
/terms                Terms of service
/admin                Admin dashboard (P2)
```

## Appendix B — API surface (already wired)

Documented in `docs/API.md`. Core:
- `POST /api/auth/{register,login,send-otp,verify-otp,google}`
- `GET/PUT /api/auth/profile`
- `GET /api/influencers?tier=&city=&q=&gender=&platform=&niche=&page=&limit=`
- `GET /api/influencers/:id`
- `PUT /api/influencers/profile|presence|connect-social`
- `GET/POST/PUT/DELETE /api/campaigns/:id?`
- `POST /api/campaigns/:id/proposals`
- `GET /api/proposals/:id?`
- `POST /api/messages/send`, `GET /api/messages/conversations(/:id)`
- `POST /api/membership/{order,purchase,webhook}`, `GET /status`, `PUT /cancel`
- `POST /api/contact` (public), `GET/PUT /api/contact/:id?` (admin)
