# Kalakaarian — Pre-Launch Security Review

> Scoped to the v1 launch on 2026-05-01. Re-run before every public release.
> Owner: backend agent. Reviewer: PM. Status legend: ✅ pass | ⚠️ partial | ❌ gap.

## Threat model (top 10 for an India influencer marketplace)

| # | Threat | Likelihood | Impact | Mitigation status |
|---|---|---|---|---|
| 1 | OTP brute-force → account takeover | High | Critical | ❌ → fix in P0-1 |
| 2 | Payment double-charge / extension exploit | Medium | High | ❌ → fix in P0-2 |
| 3 | Stolen JWT (XSS, leaked localStorage) | Medium | High | ⚠️ → P1-4 (cut TTL + tokenVersion) |
| 4 | NoSQL injection on search params | Low | High | ✅ mongo-sanitize + escapeRegex |
| 5 | DM spam / harassment | High | Medium | ❌ → fix in P0-4 |
| 6 | Razorpay webhook spoofing | Low | Critical | ✅ HMAC verified |
| 7 | Admin endpoint exposure | Low | Critical | ✅ `requireAdmin` on contact admin |
| 8 | PII leak in API responses | Medium | High | ✅ `getInfluencerById` populates name only |
| 9 | CORS misconfiguration | Low | Medium | ✅ allowlist via `CORS_ORIGINS` |
| 10 | Stale dependencies / known CVEs | Medium | Medium | ⚠️ run `npm audit` weekly |

---

## Authentication & session

| Check | Status | Evidence / Gap |
|---|---|---|
| Password ≥ 8 chars | ✅ | `routes/auth.ts` validator |
| Password hashed (bcrypt) | ✅ | `User` schema pre-save hook |
| Google ID token verified server-side | ✅ | `authController.ts` uses `OAuth2Client.verifyIdToken()` |
| OTP hashed in DB (bcrypt) | ✅ | `otpController.ts:22` |
| OTP TTL enforced | ✅ | `expiresAt` checked on verify, MongoDB TTL index removes records |
| OTP send rate-limited | ✅ | `otpLimiter` 5/hour/phone |
| **OTP verify rate-limited** | ❌ | *No limiter on `/verify-otp`. Add limiter (10/15min/phone) + attempt counter (P0-1).* |
| **OTP attempt lockout** | ❌ | *`attempts` field not incremented (P0-1).* |
| JWT signed with strong secret | ✅ | `JWT_SECRET` fail-fast on boot |
| JWT TTL ≤ 30 days | ⚠️ | *Currently 30d; cut to 7d for v1.* |
| Logout invalidates token | ❌ | *No `tokenVersion` field. P1-4.* |
| Auth middleware on every protected route | ✅ | Spot-checked routes |
| Admin role enforced separately | ✅ | `requireAdmin` middleware |

## Authorization

| Check | Status | Evidence / Gap |
|---|---|---|
| `req.user.userId` from middleware (never `(req as any).userId`) | ✅ | `AuthRequest` used consistently |
| Influencer-only routes guard role | ✅ | `connect-social`, `presence` |
| Brand-only campaign mutations | ⚠️ | *Verify `PUT /campaigns/:id` rejects non-owner. Read controller before launch.* |
| Conversation participant check on read | ✅ | `messages.ts:81` |
| **Conversation participant check on write** | ❌ | *Anyone authenticated can `POST /messages/send` to anyone (P0-4).* |
| Admin contact routes auth+admin | ✅ | `contact.ts:59,68` |

## Input validation

| Check | Status |
|---|---|
| `express-mongo-sanitize` global | ✅ |
| Regex params escaped (`escapeRegex`) | ✅ |
| Pagination clamp (`limit ≤ 100`) | ✅ |
| Whitelisted enums (gender, tier, status) | ✅ |
| ISO8601 date validation on campaign deadline | ✅ |
| File-upload MIME / size whitelist | ⚠️ *audit `routes/upload.ts` before launch* |

## Payments

| Check | Status | Evidence / Gap |
|---|---|---|
| Razorpay client-side signature verified server | ✅ | `verifySignature` |
| Razorpay webhook HMAC verified | ✅ | `verifyWebhookSignature` |
| Webhook raw body preserved | ✅ | `app.ts:56` precedes `express.json()` |
| **Activation idempotent on `paymentId`** | ❌ | *Both purchase + webhook activate, double-extends (P0-2).* |
| **Expired memberships demoted** | ❌ | *`/status` ignores `endDate` (P0-3).* |
| Transaction audit log | ❌ | *`Transaction` model unused (P1-5).* |
| GST-compliant invoice | ❌ | *Plain receipt only (P1-6).* |
| Refund flow | ❌ | *Not implemented; manual via Razorpay dashboard for v1.* |

## Infrastructure / transport

| Check | Status |
|---|---|
| HTTPS only | ✅ Vercel edge enforces |
| HSTS header | ⚠️ *Add via Vercel headers config.* |
| CSP header | ❌ *Add a baseline CSP. Document in `OPS_RUNBOOK.md`.* |
| CORS allowlist (no `*`) | ✅ |
| Secrets in Vercel env (not repo) | ✅ |
| `.env.example` committed, `.env` gitignored | ✅ |
| Mongo Atlas IP allowlist or VPC peering | ⚠️ *Verify Atlas allows Vercel's IPs; serverless has dynamic IPs → allow `0.0.0.0/0` is acceptable behind strong auth + TLS.* |

## Observability & forensics

| Check | Status |
|---|---|
| Sentry server | ✅ `app.ts:30-36` |
| Sentry client | ❌ *P1-11.* |
| Structured logging | ❌ *console.log; defer to v2 (`pino`).* |
| Request ID / correlation ID | ❌ *Add a simple middleware (15 lines) for v1.* |
| Audit log on admin actions | ❌ *Defer to post-launch.* |

## Data protection

| Check | Status |
|---|---|
| Email/phone never logged | ⚠️ *Spot-check logs; OTP code never logged ✅* |
| PII fields scoped on populate (`name` only) | ✅ |
| Soft-delete on User | ❌ *Hard delete only; P2-7.* |
| MongoDB backups | ⚠️ *Atlas auto-backup tier-dependent; verify M0/M2 settings.* |
| GDPR/India DPDP exposure | ⚠️ *Privacy policy + DPDP-compliant consent banner needed before public launch.* |

## Dependency hygiene

```bash
# Run before every release
cd server && npm audit --audit-level=high
cd ../client && npm audit --audit-level=high
```
**Status:** not run yet. Add to `LAUNCH_PLAN.md` Day-2 (Apr 27).

---

## Final pre-launch security gate (Apr 30 EOD)

The following must be ✅ before pushing to `main` on launch day:

- [ ] P0-1 OTP attempt lockout merged + tested
- [ ] P0-2 Membership idempotency merged + tested with replayed webhook
- [ ] P0-3 Expired-membership demotion merged + tested
- [ ] P0-4 DM relationship guard merged + tested
- [ ] P0-5 Server smoke tests green in CI
- [ ] P1-1 PostHog initialized, smoke event fires
- [ ] P1-2 Staging env exists; user-test cohort signed off there
- [ ] P1-3 CI workflow runs typecheck/lint/test on PR, blocks merge on red
- [ ] P1-4 JWT TTL = 7d; tokenVersion claim live
- [ ] P1-5 `Transaction` writes on every paid event
- [ ] P1-6 GST invoice generation working in staging
- [ ] P1-11 Sentry client init + error boundary wraps `<App>`
- [ ] HSTS + minimal CSP headers added via `vercel.json`
- [ ] `npm audit` high-severity = 0 in both workspaces
- [ ] Privacy Policy + Terms pages live at `/privacy`, `/terms`
- [ ] Admin user created in prod with strong password + 2FA on email
- [ ] All seed data removed from prod DB
