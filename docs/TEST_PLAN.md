# Kalakaarian — Test Plan

> Two layers: (1) automated tests gating CI, (2) the live user-test on Mon Apr 27.

## 1. Automated test pyramid

```
         ▲
        ╱e2e╲                 5–8 critical-path Playwright specs
       ╱─────╲
      ╱integ. ╲                20+ supertest API tests
     ╱────────-╲
    ╱   unit    ╲              ~40 vitest unit tests (helpers, validators)
   ╱─────────────╲
```

### 1a. Server unit + integration (vitest + supertest)
**Location:** `server/test/`. Boot the Express app against `mongodb-memory-server`; reset DB between tests.

Coverage matrix lives in `FEATURE_SPECS.md → F5`. Minimum 20 cases for launch. Add 1 test per controller per merge (post-launch).

### 1b. Client unit (vitest)
- `useAuth` hook
- `useCart` hook
- `lib/utils.ts` formatters
- `api/*` clients (mocked axios)
- Form validators (proposal bidAmount, campaign budget)

### 1c. End-to-end (Playwright)
8 critical paths to cover by Wed Apr 29:
1. Brand signup (email) → role select → brand profile → dashboard
2. Influencer signup (Google mock) → role select → influencer profile → connect IG (mock) → dashboard
3. Brand creates campaign → appears on `/browse-campaigns`
4. Influencer submits proposal → brand sees it in dashboard
5. Brand opens chat with influencer → message sent → influencer sees message
6. Influencer purchases Silver in test mode → /status returns silver
7. PWA: install banner shown on supported browser
8. Logout → token invalid → redirect to /login

### 1d. CI configuration
- Trigger: pull_request, push (to all branches)
- Steps: install → typecheck → lint → test (server) → test (client unit) → build (client)
- Required checks on `main`: typecheck + test (server) + test (client) + build
- Playwright runs nightly + before deploy (not on every PR — too slow)

---

## 2. User test — Monday Apr 27

### 2.1 Goals
1. Confirm signup flow works end-to-end on real devices (Android Chrome + iOS Safari).
2. Confirm price + tier filtering and proposal flow are intuitive without instructions.
3. Discover unknown bugs.
4. Get qualitative feedback: "would you use this monthly?"

### 2.2 Cohort
- 5 brands (D2C founders, agency hires, your network)
- 10 influencers (3 nano <10k, 5 micro 10–100k, 2 mid 100k–500k)
- 5 mixed pairs for end-to-end flow

### 2.3 Setup
- Staging URL: `staging.kalakaarian.com`
- Pre-seeded DB with 200 influencer profiles, 5 open campaigns
- Razorpay test mode keys
- Sentry + PostHog wired (separate projects from prod)
- WhatsApp group for live feedback

### 2.4 Slot schedule (IST)

| Slot | Time | Cohort | Tasks |
|---|---|---|---|
| 1 | 10:00–12:00 | 5 brands | Sign up → post 1 campaign → review proposals → message 1 influencer |
| 2 | 14:00–16:00 | 10 influencers | Sign up → connect IG → submit 2 proposals → reply to brand chat |
| 3 | 16:00–18:00 | 5 mixed pairs | Brand accepts a proposal; influencer marks delivery; brand accepts; influencer buys Silver |

### 2.5 Per-task acceptance scripts

**Brand task: post a campaign**
- Open `/login` → register with email → role-select brand → fill brand profile (auto-redirect to /create-campaign).
- Fill minimal campaign: title "Spring kurta launch", brief 2 lines, deliverables "1 reel + 2 stories", platforms IG, budget ₹10000, deadline 14 days from now.
- Submit. Expect: redirect to `/brand/dashboard`, campaign visible with status `open`.
- Open `/browse-campaigns` (in incognito) — should see your campaign.

**Influencer task: submit a proposal**
- Register with phone-OTP. (OTP arrives via email if WhatsApp BSP not approved yet.)
- Role-select influencer → fill profile (bio 80 chars, city, gender, niches=2, tier=micro, IG handle, pricing reel ₹5000).
- Open `/browse-campaigns` → click first campaign → submit proposal: bid ₹5000, message 100 chars, timeline 7 days.
- Expect: redirect to "Proposal submitted" screen; proposal visible in `/influencer/dashboard`.

**Pair: end-to-end**
- Brand opens dashboard → reviews proposals on their campaign → opens chat with one influencer → sends "Can you also do 1 IG static post?".
- Influencer receives message in `/messages`, replies "Yes, +₹2000".
- Brand accepts proposal → campaign workflow advances.
- Influencer "uploads" deliverable (mocked URL field for now).
- Brand clicks "Accept delivery" (when F13 ships).
- Influencer upgrades to Silver → Razorpay test card 4111 1111 1111 1111 → success → membership status = silver.

### 2.6 Instrumentation

**PostHog dashboard** (set up Sun Apr 26):
- Funnel: signup_started → signup_completed → role_selected → profile_completed → first_action (campaign_created OR proposal_submitted)
- Drop-off at each step
- Time-to-first-action

**Sentry**: 0 unresolved errors > P3 by EOD.

**Manual capture**: 1-line bug report template:
```
Persona: brand|influencer
Device + browser:
URL:
Steps:
Expected:
Actual:
Severity: P0|P1|P2|P3
```

### 2.7 Triage cadence
- Real-time: monitor Sentry + PostHog + WhatsApp.
- Hourly: PM agent scans Sentry "new" errors, files issues.
- 18:00–19:00: triage call with backend + frontend agents. Decide what gets hot-fixed today vs. tomorrow.

### 2.8 Exit criteria (decision time: 22:00 Mon)
- [ ] Each cohort completed at least one happy path.
- [ ] No P0 (security/data-loss) bug uncovered.
- [ ] ≤ 5 P1 bugs open and assigned.
- [ ] At least 50% of cohort says "yes, I'd use this monthly" (NPS-lite).

If all yes → proceed to D-3 P1 batch.
If any no → emergency triage; consider 3-day slip.

---

## 3. Pre-launch dress rehearsal (Thu Apr 30)

Run the full Playwright e2e suite against staging deployed from `main` branch (1-day-stale build). Then do manual:

| Path | Pass |
|---|---|
| Sign up brand (email) | |
| Sign up influencer (Google) | |
| Sign up influencer (phone-OTP) | |
| Post campaign | |
| Submit proposal | |
| Accept proposal | |
| Send 5 messages back-and-forth | |
| Upload deliverable | |
| Accept deliverable | |
| Buy Silver (test mode) | |
| Buy Gold (test mode) | |
| Cancel auto-renew | |
| Refresh /status — expired record returns regular | |
| Force 401 / 403 / 429 / 500 → correct UX | |
| Open in airplane mode → offline.html | |
| Install PWA on Android Chrome | |
| Lighthouse PWA ≥ 90 | |

---

## 4. Production smoke (Fri May 1, 09:15 IST)
Same as §3 but on prod with **real** Razorpay (skip the buy-Silver step in prod with Rishi's own test card; immediately refund). 12-step checklist; 15 minutes max.
