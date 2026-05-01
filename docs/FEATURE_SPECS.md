# Kalakaarian — Per-Feature Build / Test / Deploy Specs

> One section per feature on the launch path. Each section: spec → API contract → DB delta → frontend flow → tests → deploy gate → rollback.
> Owner agent is shown in the header. Files reference `server/src/...` and `client/src/...`.

---

## F1 · OTP attempt lockout (P0-1)
**Owner:** backend
**Why:** prevent brute-force of 6-digit OTPs.

### Spec
On `verifyOTP`:
1. Atomically increment `attempts`.
2. If `attempts >= 5`, delete the record and return 429 with `{ message: "Too many attempts. Request a new OTP." }`.
3. On success, delete record (already done).
4. Add `verifyOtpLimiter` (10 reqs / 15 min / phone) on `POST /auth/verify-otp`.

### API contract delta
No external change. Error responses now include 429.

### DB delta
None — `attempts` already on schema.

### Code change pointers
- `server/src/controllers/otpController.ts:47` — replace `findOne` with `findOneAndUpdate({phone}, {$inc:{attempts:1}}, {new:true})`. Check `attempts >= 5` before bcrypt compare. On match, decrement isn't needed since we delete.
- `server/src/routes/auth.ts` — add `verifyOtpLimiter` (clone of `otpLimiter` keyed by `req.body.phone`).

### Tests (vitest + supertest)
```ts
it('locks after 5 failed attempts', async () => {
  await request(app).post('/api/auth/send-otp').send({ phone });
  for (let i = 0; i < 5; i++) {
    const r = await request(app).post('/api/auth/verify-otp').send({ phone, otp: '000000' });
    expect(r.status).toBe(400);
  }
  const r = await request(app).post('/api/auth/verify-otp').send({ phone, otp: '000000' });
  expect(r.status).toBe(429);
});
```

### Deploy gate
- 100% test green
- Manual: send valid OTP, verify with wrong code 5×, expect 429 and that the *correct* OTP no longer works (must request new).

### Rollback
Revert PR. No data migration; `attempts` field stays harmless.

---

## F2 · Membership idempotency + extension (P0-2)
**Owner:** backend
**Why:** prevent free month-extensions caused by webhook + purchase double-write.

### Spec
- Activation must be **idempotent** on Razorpay `paymentId`.
- Renewal must **extend** `endDate` (`max(endDate, now) + 30d`), never reset.
- Source of truth = `/webhook`. `/purchase` only verifies signature, returns 200, and queues an optimistic activation that the webhook will confirm.

### API contract delta
- `POST /api/membership/purchase` — response unchanged on success; on signature fail returns 400.
- `POST /api/membership/webhook` — handler must check if `paymentId` already in `Membership.paymentIds`; if yes, no-op + 200.

### DB delta
```ts
// models/Membership.ts
paymentIds: { type: [String], default: [], index: true }  // unique within array
```
Migration: `Membership.updateMany({}, [{ $set: { paymentIds: { $cond: [{ $ifNull: ['$paymentId', false] }, ['$paymentId'], []] } }}])`.

### Code change pointers
- `models/Membership.ts` — add `paymentIds`. Keep `paymentId` for now (backwards compat).
- `routes/membership.ts:47-89` — purchase no longer activates. Remove the `findOneAndUpdate`. Just verify signature, return 200.
- `routes/membership.ts:112-168` — webhook: check `paymentIds.includes(payment.id)`; if yes return 200 immediately. Else compute `newEnd = max(existing.endDate ?? now, now) + 30d`, push paymentId, save. Wrap in try/catch.

### Tests
```ts
it('webhook replay does not extend twice', async () => {
  const evt = signedWebhookEvent('pay_123', { userId, tier: 'gold' });
  await request(app).post('/api/membership/webhook').set(...evt).send(evt.body);
  const m1 = await Membership.findOne({ influencerId: userId });
  await request(app).post('/api/membership/webhook').set(...evt).send(evt.body);
  const m2 = await Membership.findOne({ influencerId: userId });
  expect(m2.endDate.getTime()).toBe(m1.endDate.getTime());
});

it('renewal extends endDate', async () => {
  await activate('pay_1');
  const before = (await Membership.findOne({...})).endDate;
  jest.advanceTime(15 * 24 * 60 * 60 * 1000);
  await activate('pay_2');
  const after = (await Membership.findOne({...})).endDate;
  expect(after.getTime() - before.getTime()).toBeGreaterThan(15 * 24 * 60 * 60 * 1000);
});
```

### Deploy gate
- Tests green
- Manual: in Razorpay test mode, fire same `payment.captured` payload twice via curl with valid HMAC; check `paymentIds` length = 1.

### Rollback
Revert PR. Schema delta is additive, safe to leave.

---

## F3 · Membership expiry on read (P0-3)
**Owner:** backend
**Why:** users with expired memberships should not retain Gold/Silver privileges.

### Spec
`GET /api/membership/status` returns `{ tier: 'regular' }` if `endDate < now`, regardless of stored tier. No background job needed.

### Code change
```ts
// routes/membership.ts:91
const m = await Membership.findOne({ influencerId: userId });
if (!m || m.endDate < new Date()) return res.json({ tier: 'regular' });
res.json(m);
```

### Tests
```ts
it('expired membership returns regular', async () => {
  await Membership.create({ influencerId: userId, tier: 'gold', endDate: new Date(Date.now() - 1000) });
  const r = await request(app).get('/api/membership/status').set('Authorization', `Bearer ${token}`);
  expect(r.body.tier).toBe('regular');
});
```

### Deploy gate
Test green + manual check on a seeded expired record.

---

## F4 · DM relationship guard + spam limiter (P0-4)
**Owner:** backend
**Why:** prevent unsolicited DMs at launch.

### Spec
First message in a conversation is allowed only if **at least one** of these holds:
1. There is an existing `Conversation` between the two users (subsequent messages).
2. Sender is the campaign owner and receiver submitted a `Proposal` to that campaign.
3. Sender submitted a `Proposal` to a `Campaign` whose `brandId == receiver`.

Add per-sender rate limit: 30 messages / 5 min.

### API contract delta
- `POST /api/messages/send` returns 403 with `{ message: "No active conversation or proposal between you" }` if guard fails.

### Code change
- New helper `services/messagingPolicy.ts` exposing `canMessage(senderId, receiverId): Promise<boolean>`.
- `routes/messages.ts:9` — call the helper before allowing send. Skip check if existing conversation found.
- New limiter `messageLimiter` in `routes/messages.ts`.

### Tests
- Unrelated users → 403.
- Brand → influencer with proposal → 200.
- Influencer → brand with proposal → 200.
- Brand → another influencer (no proposal) → 403.
- 31st message in 5min → 429.

### Deploy gate
Tests green + manual run via Postman.

---

## F5 · Server smoke tests (P0-5)
**Owner:** backend + qa
**Why:** zero existing test coverage on the API.

### Spec
Vitest + supertest. New `server/test/` dir. Connect to in-memory MongoDB via `mongodb-memory-server`. Seed minimum users in beforeAll.

### Coverage matrix (20 tests, MVP)
| # | Path | Case |
|---|---|---|
| 1 | POST /api/auth/register | happy |
| 2 | POST /api/auth/register | password < 8 → 400 |
| 3 | POST /api/auth/login | happy email |
| 4 | POST /api/auth/login | bad pw → 401 |
| 5 | POST /api/auth/send-otp | happy |
| 6 | POST /api/auth/verify-otp | happy |
| 7 | POST /api/auth/verify-otp | 5 fails → 429 (F1) |
| 8 | GET /api/auth/profile | with token → 200 |
| 9 | GET /api/auth/profile | no token → 401 |
| 10 | POST /api/campaigns | brand-only happy |
| 11 | POST /api/campaigns | influencer → 403 |
| 12 | GET /api/influencers | gender whitelist (`?gender=foo` 400) |
| 13 | GET /api/influencers | escapeRegex (`?q=.*` returns 0/normal) |
| 14 | GET /api/influencers | pagination clamp (`?limit=999` returns ≤100) |
| 15 | POST /api/messages/send | unrelated user 403 (F4) |
| 16 | POST /api/membership/purchase | bad signature 400 |
| 17 | POST /api/membership/webhook | bad sig 400 |
| 18 | POST /api/membership/webhook | replay no-op (F2) |
| 19 | GET /api/membership/status | expired → regular (F3) |
| 20 | GET /api/contact (admin) | non-admin 403 |

### CI wiring
`.github/workflows/ci.yml`:
```yaml
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
```
Required check on `main`.

### Deploy gate
20/20 green; CI required check enabled.

---

## F6 · PostHog analytics init + event spec (P1-1)
**Owner:** frontend
**Why:** zero product analytics today.

### Spec
- Init PostHog with `VITE_POSTHOG_KEY` if set; no-op otherwise.
- Capture `signup_started`, `signup_completed`, `role_selected`, `profile_completed`, `social_connected`, `campaign_created`, `proposal_submitted`, `proposal_accepted`, `message_sent`, `membership_purchased`, `referral_used`, `pwa_installed`, `consent_given`.
- Identify the user post-login (PostHog `identify(userId, { role, tier, city })`).

### Code change
- `client/src/lib/posthog.ts` (new):
```ts
import posthog from 'posthog-js';
export function initPosthog() {
  if (!import.meta.env.VITE_POSTHOG_KEY) return;
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: 'https://us.i.posthog.com', capture_pageview: true });
}
export const ph = posthog;
```
- `main.tsx` calls `initPosthog()` once.
- `useAuth` calls `ph.identify(user.id, {...})` on login; `ph.reset()` on logout.
- Each event sprinkled at the call-site (forms / mutations).

### Tests
- Mock `posthog-js`; assert `capture` called with right args on each tracked action.

### Deploy gate
Live event in PostHog dashboard within 15 min of staging deploy.

---

## F7 · Sentry client init + error boundary (P1-11)
**Owner:** frontend

### Spec
- Init `@sentry/react` with `VITE_SENTRY_DSN`. `tracesSampleRate: 0.2`. Release = `import.meta.env.VITE_GIT_SHA`.
- Wrap `<App/>` with `Sentry.ErrorBoundary fallback={<ErrorPage/>} showDialog={false}`.
- `Sentry.setUser({ id, role })` on login; clear on logout.

### Code change
- `client/src/lib/sentry.ts` new init + boundary export.
- `main.tsx` calls init.

### Tests
- Synthetic `throw new Error('test_sentry')` from a hidden dev button → see in Sentry.

### Deploy gate
Synthetic error visible in Sentry within 5 min.

---

## F8 · JWT TTL + tokenVersion (P1-4)
**Owner:** backend

### Spec
- Reduce JWT TTL from 30d → 7d.
- Add `User.tokenVersion: number` (default 0).
- JWT now includes `tokenVersion`.
- `auth` middleware: load user; if `decoded.tokenVersion !== user.tokenVersion`, 401.
- `POST /api/auth/logout` increments `tokenVersion` (invalidates all tokens for that user).
- `POST /api/auth/password/change` (future) also increments.

### DB delta
`User.tokenVersion: { type: Number, default: 0 }`. No migration needed for existing users (default 0; old tokens still validate until they expire because they have no `tokenVersion` claim — strictly enforce only for new tokens issued after deploy; or treat missing `tokenVersion` as 0).

### Tests
- Login → call /profile → ok.
- Logout → call /profile with old token → 401.
- 7d expired token → 401.

---

## F9 · Transaction audit log (P1-5)
**Owner:** backend
**Why:** support, refunds, and GST returns require an off-DB-of-Membership trail.

### Spec
On every paid event (purchase verify, webhook activate, future payouts), insert a `Transaction`:
```ts
{ userId, amount, type: 'membership_payment'|'campaign_payment'|'payout',
  status: 'success'|'failed'|'pending'|'refunded',
  paymentId, providerOrderId, tier, description, createdAt }
```
Idempotent on `paymentId`.

### Code change
- `routes/membership.ts` webhook: after activation, `Transaction.findOneAndUpdate({ paymentId }, {...}, { upsert: true })`.
- New `routes/transactions.ts` admin-only `GET /api/transactions?userId=&from=&to=` for support.

---

## F10 · GST invoice generation (P1-6)
**Owner:** backend + content
**Why:** Indian compliance. Required for any paid transaction.

### Spec
- Sequential invoice number per FY: `2026-27/INV/0001` (atomic counter via dedicated collection).
- Fields: GSTIN, HSN/SAC `998314` (advertising/marketing), IGST 18% for inter-state, CGST+SGST 9%+9% for intra-state. For digital service to a registered business, IGST 18% always (place-of-supply rules).
- Generate PDF with `pdfkit`, attach to invoice email.
- Store URL in `Transaction.invoiceUrl`. Upload to storage (R2/S3 in v1 or `cloudinary`).

### Tests
- Generate invoice → PDF parses, contains GSTIN, totals add up.

---

## F11 · Search ranking composite sort (P1-7)
**Owner:** backend

### Spec
`GET /api/influencers` order:
1. `isOnline` desc (true first)
2. `lastSeenAt` desc
3. tier rank: gold > silver > regular (use a `$switch` aggregation, or pre-stored numeric `tierRank`)
4. `createdAt` desc

### Code change
- Add `tierRank` virtual or stored field on `InfluencerProfile`.
- `controllers/influencerController.ts` — replace `.sort({ createdAt: -1 })` with the composite.

### Tests
- Seed 3 influencers (online gold, offline gold, online silver). Expect order: online gold, online silver, offline gold.

---

## F12 · Report user / content (P1-8)
**Owner:** backend + frontend

### Spec
- New `Report` schema: `reporterId, targetType ('user'|'message'|'campaign'|'proposal'), targetId, reason, status ('open'|'reviewing'|'resolved'|'dismissed')`.
- `POST /api/reports` (auth required, rate-limited 5/hour/user).
- `GET /api/reports` admin only.
- Frontend: small "Report" button on influencer profile, on each message, on each campaign card.

### Tests
- Report a user → row exists; admin lists it.
- Non-admin GET → 403.

---

## F13 · Deliverable accept (P1-9)
**Owner:** backend + frontend

### Spec
- New endpoint `POST /api/campaigns/:id/deliverables/:deliverableId/accept` (brand-owner-only).
- On accept, transition `CampaignWorkflow.currentStage` → `payment`. Notify influencer.
- New endpoint `POST /api/campaigns/:id/deliverables/:deliverableId/reject` with `reason`.
- Frontend: brand dashboard shows pending deliverables with Accept/Reject buttons.

### Tests
- Brand-owner can accept; other brand → 403; influencer → 403.
- Workflow stage advances.

---

## F14 · Privacy / Terms / DPDP consent banner (Apr 29)
**Owner:** content + frontend

### Spec
- `client/src/pages/Privacy.tsx`, `Terms.tsx` — legal-reviewed text.
- Component `<ConsentBanner/>`: shown to first-time visitors, 2 buttons (Accept all / Essential only). Stores `consent: 'all'|'essential'` in localStorage. Emits `consent_given` PostHog event with the choice. Does not block PostHog from loading; loads in essential mode if user picks essential.

### Tests
- Visit incognito → banner appears. Click Accept → stored. Reload → no banner.

---

## F15 · PWA verify & install metrics (P1-10)
**Owner:** frontend

### Spec
- Verify `manifest.webmanifest` is generated by Vite PWA plugin and includes: name, short_name, start_url, scope, display=`standalone`, theme_color, background_color, 192/512 icons.
- Service worker: navigation fallback to `/offline.html`.
- Track:
  - `beforeinstallprompt` → `pwa_install_prompt_shown`
  - `appinstalled` → `pwa_installed` (PostHog)
- Manual install on Android Chrome — confirm icon, splash, opens in standalone.

### Tests
- Lighthouse PWA audit ≥ 90 (CI step?: defer to v2; manual for v1).

---

## F16 · Staging environment + CI (P1-2, P1-3)
**Owner:** devops

### Spec
- New git branch `staging`. Vercel preview alias `staging.kalakaarian.com` bound to it.
- Separate Mongo Atlas DB.
- Vercel staging env vars: `MONGODB_URI=...`, `JWT_SECRET=...` (different from prod), `CORS_ORIGINS=https://staging.kalakaarian.com`, `RAZORPAY_KEY_ID`/`SECRET` (test keys), `SENTRY_DSN`, `POSTHOG_KEY` (separate project).
- CI workflow on every PR: typecheck, lint, test (server + client). Required check on `main`.
- Branch flow: feature → PR → staging (auto-deploy preview) → manual merge → main (deploy to prod).

### Deploy gate
- PR can be merged only if CI green.
- `staging` deploys autonomously.
- Promotion to prod = manual merge to `main` after gate passed.

---

## F17 · Vercel security headers
**Owner:** devops

### `vercel.json` addition:
```json
{
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://us.i.posthog.com https://*.razorpay.com; img-src 'self' data: https:; connect-src 'self' https://api.kalakaarian.com https://us.i.posthog.com https://o*.ingest.sentry.io https://*.razorpay.com; frame-src https://*.razorpay.com" }
    ]}
  ]
}
```

### Test
- Headers visible via `curl -I`. CSP doesn't break Razorpay checkout (manual test in staging).

---

## Standing build/test/deploy template

Use this template for any new feature post-launch:

```
### Spec
- One paragraph problem + one paragraph proposed UX.

### API contract delta
- METHOD /path | input shape | output shape | auth | error codes

### DB delta
- New fields / new indexes / migration script

### Code change pointers
- file:line callouts

### Tests
- unit (vitest), integration (supertest), e2e (playwright)

### Deploy gate
- Tests green | Lighthouse | Sentry has 0 P0 events | Manual smoke

### Rollback
- Revert path; data migration safety
```
