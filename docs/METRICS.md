# Kalakaarian — Metrics Framework

> One source of truth for product metrics. Tied to PostHog event spec and a weekly review cadence.

## 1. North star

**Weekly Accepted Proposals (WAP)**
A proposal moves from `pending` → `accepted`. This single metric captures both sides of the marketplace working: a brand decided an influencer was worth paying, and the influencer was responsive enough to be chosen.

Target: **30 in week 1 → 300 in week 4 → 1,000 by week 12.**

## 2. Tree

```
WAP (north star)
│
├── Liquidity (supply × demand)
│   ├── Active brands w/ open campaign
│   ├── Active influencers (online or active in 7d)
│   └── Median proposals per campaign
│
├── Activation
│   ├── Signup → role-selected (%)
│   ├── Role-selected → profile-completed (%)
│   ├── Profile-completed → first social-handle-connected (influencer) | first-campaign-posted (brand) (%)
│   └── Time-to-first-action (median)
│
├── Engagement
│   ├── DAU / WAU / MAU
│   ├── Sessions/user/week
│   └── Messages sent per active conversation
│
├── Monetization
│   ├── Paying influencers (Silver + Gold count)
│   ├── ARPPU (avg revenue per paying user)
│   ├── GMV (sum of accepted proposal bidAmount, post 5% margin)
│   └── Take rate (5% margin × GMV)
│
└── Health
    ├── Crash-free sessions (Sentry)
    ├── p50 / p95 / p99 API latency (Vercel)
    ├── Error rate (5xx / total)
    └── PWA install rate
```

## 3. PostHog event spec

Names are `snake_case`. Properties use `snake_case`. Always include `role` (brand|influencer|admin) on identified events.

| Event | When | Required props |
|---|---|---|
| `signup_started` | First /register submit attempt | method (email\|google\|phone) |
| `signup_completed` | Successful registration | method, role |
| `role_selected` | After role-select page | role |
| `profile_completed` | Required fields filled | role, time_since_signup_seconds |
| `social_connected` | Influencer connects IG/YT | platform |
| `campaign_created` | Brand posts campaign | budget_inr, platforms, niches |
| `campaign_viewed` | Visits a campaign detail page | campaign_id, viewer_role |
| `proposal_submitted` | Influencer pitches | campaign_id, bid_inr, timeline_days |
| `proposal_accepted` | Brand accepts proposal | campaign_id, bid_inr |
| `proposal_rejected` | Brand rejects | campaign_id, bid_inr |
| `message_sent` | DM sent | conversation_id, content_length |
| `deliverable_uploaded` | Influencer marks deliverable | campaign_id |
| `deliverable_accepted` | Brand accepts | campaign_id |
| `membership_purchased` | Razorpay success | tier, amount_inr |
| `membership_cancelled` | Auto-renew off | tier |
| `referral_used` | Signup with code | referral_code |
| `report_filed` | User reports | target_type |
| `consent_given` | DPDP banner | choice (all\|essential) |
| `pwa_install_prompt_shown` | beforeinstallprompt | — |
| `pwa_installed` | appinstalled | — |
| `search_performed` | Marketplace search | query_length, filters_count |

## 4. Weekly review (every Mon 10:00 IST)

PM (Rishi) reviews dashboards in this order, takes one decision per area:

| Area | Question | Action if bad |
|---|---|---|
| Activation | Where in the funnel are users dropping? | Land 1 UX fix in next sprint |
| Liquidity | Are campaigns getting ≥ 5 proposals each? | If no: marketing push for influencers |
| Quality | Is acceptance rate ≥ 15%? | If no: improve match (filters, niche tags) |
| Monetization | Conversion to Silver+ ≥ 2% of active influencers? | If no: revisit pricing or perks |
| Health | Crash-free ≥ 99.5%, p95 ≤ 800ms? | If no: tech work next sprint |

Output: 5-line Slack/email update + 1 decision per area.

## 5. Targets

| Metric | Day 7 | Day 30 | Day 90 |
|---|---|---|---|
| Signups (combined) | 250 | 2,000 | 10,000 |
| Activated influencers | 100 | 1,000 | 5,000 |
| Activated brands | 20 | 150 | 800 |
| Open campaigns | 30 | 200 | 1,000 |
| Proposals submitted | 200 | 2,000 | 12,000 |
| Accepted proposals | 30 | 300 | 1,500 |
| Paying influencers (Silver+Gold) | 5 | 50 | 300 |
| GMV | ₹50k | ₹5L | ₹40L |
| MRR (subscription only) | ₹5k | ₹50k | ₹3L |
| Take rate income (5% × GMV) | ₹2.5k | ₹25k | ₹2L |
| Crash-free sessions | 99.0% | 99.5% | 99.8% |
| p95 API latency | < 1.2s | < 800ms | < 500ms |

## 6. Cohort views to set up

- **Signup-week cohort** retention (% returning in W2, W3, W4)
- **Activation cohort** by acquisition channel (organic, referral, paid, founder-network)
- **Tier cohort** behavior (regular vs silver vs gold engagement, GMV)
- **Geo cohort** (city: Mumbai, Bangalore, Delhi, Pune, Hyderabad, rest)

## 7. Operational dashboards

Set up by Wed Apr 29 (PostHog dashboards):
1. **Acquisition** — DAU/WAU/MAU, signup funnel, source breakdown
2. **Marketplace** — open campaigns, proposals/campaign, accept rate, time-to-first-proposal
3. **Monetization** — Silver/Gold counts, ARPPU, GMV, take rate
4. **Health** — Sentry overlay, p95 latency, error budget
5. **User-test** (Apr 27 only) — real-time funnel + drop-off, pinned per persona
