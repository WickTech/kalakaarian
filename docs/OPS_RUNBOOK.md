# Kalakaarian — Production Ops Runbook

> Steady-state operations and incident response. Keep this brief and actionable.

## 1. Environments

| Env | URL | DB | Razorpay | Branch |
|---|---|---|---|---|
| local | localhost:5173 / vercel dev | local Mongo or staging Atlas | test | feature/* |
| staging | staging.kalakaarian.com | Atlas `kalakaarian-staging` | test | staging |
| **prod** | kalakaarian.com | Atlas `kalakaarian-prod` (M10+) | **live** | main |

## 2. Required env vars

In Vercel project settings (separate sets per environment). Source-of-truth template: `.env.example`.

**Server** (mandatory): `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SENTRY_DSN`, `RESEND_API_KEY` (or SMTP).
**Server** (optional): `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `INSTAGRAM_TOKEN`, `YOUTUBE_API_KEY`, `S3_*` or `R2_*`.

**Client** (mandatory at build time): `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
**Client** (optional): `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_RAZORPAY_KEY_ID`, `VITE_GIT_SHA` (set in CI).

Server fail-fasts on boot if any of `MONGODB_URI` / `JWT_SECRET` / `GOOGLE_CLIENT_ID` is missing (`server/src/app.ts:39-41`).

## 3. Deploy procedure

### 3.1 Standard deploy (PR → staging → main)
1. Open PR from `feature/*` to `staging`.
2. CI must be green (typecheck, lint, server tests, client tests, client build).
3. Merge → Vercel auto-deploys preview to `staging.kalakaarian.com`.
4. QA / smoke check on staging.
5. Open PR from `staging` to `main`.
6. CI must be green; required reviewer: Rishi.
7. Merge → Vercel auto-deploys to `kalakaarian.com`.
8. Smoke test prod (3 minutes).
9. Tag the commit: `git tag v1.x.y && git push --tags`.

### 3.2 Hot-fix deploy
1. Branch from `main` directly: `hotfix/<short-name>`.
2. Open PR straight to `main` (skip staging).
3. CI must be green.
4. Self-merge if Rishi authored, otherwise PR-review by Rishi.
5. Smoke check immediately after deploy.
6. Cherry-pick to `staging` to keep branches in sync.

### 3.3 Rollback
- One-click via Vercel dashboard → Deployments → "Promote to production" on the previous green build.
- DB migrations in Kalakaarian are additive-only (P0 PRs designed this way), so DB rollback is rarely needed.
- If a webhook handler is broken, also disable the Razorpay webhook in their dashboard temporarily, then re-enable after rollback.

## 4. On-call

### 4.1 Coverage (launch week)
- Primary: Rishi (09:00–22:00 IST)
- Secondary: TBD (overnight)
- Escalation: phone

### 4.2 Pager triggers
- Sentry: spike >5 errors / minute on prod
- Vercel: deploy failed
- Mongo Atlas: connection failures > 3% in 5 min
- Razorpay webhook 5xx > 3 in 10 min
- p95 API latency > 2s for 5+ min
- Crash-free sessions < 99% in last hour

### 4.3 Severity ladder
- **SEV1** — site down, payments broken, data loss. Rollback in < 15 min. Status post.
- **SEV2** — major flow broken (signup, proposal, chat) for >30% users. Hot-fix in < 2 hr.
- **SEV3** — minor flow broken, P1 bug. Fix in next deploy cycle.
- **SEV4** — cosmetic / non-blocking. Backlog.

## 5. Incident response template

```
INCIDENT-YYYYMMDD-NN

Detected: <time, who, how>
Impact: <users affected, dollars at risk, flow broken>
Severity: SEV1|2|3|4
Owner: <name>
Comms: <status page updated? users notified?>

Timeline:
  HH:MM  Detected
  HH:MM  Diagnosed
  HH:MM  Mitigated
  HH:MM  Resolved

Root cause: <one paragraph>
Action items: <prevention, monitoring>
```

## 6. Common ops tasks

### 6.1 Look up a user
- Mongo: `db.users.findOne({ email: '...' })` or by `_id`.
- PostHog: search by user_id (set on identify).
- Sentry: search user.id.

### 6.2 Refund a membership
1. Razorpay dashboard → Payments → find by `paymentId`.
2. Issue refund.
3. In Mongo: `db.memberships.updateOne({ paymentId }, { $set: { tier: 'regular', endDate: new Date() } })`.
4. Add `Transaction { type: 'refund', status: 'success', paymentId, amount }`.
5. Email user a confirmation.

### 6.3 Force a user logout (token compromise)
- Mongo: `db.users.updateOne({ _id }, { $inc: { tokenVersion: 1 } })`. (Requires F8.)

### 6.4 Block a user
- Add `User.blocked: true` (P2 schema).
- Auth middleware checks `user.blocked` → 403.

### 6.5 Re-run a failed Razorpay webhook
1. Verify the issue is fixed in code (deploy).
2. Razorpay dashboard → Webhook deliveries → find the failed event → "Resend".
3. Activation is idempotent (F2), safe to replay.

### 6.6 Mongo Atlas alerts to set
- Connections > 80% of tier max
- Replication lag > 30s
- Storage > 80%
- Slow query log enabled, threshold 200ms

## 7. Backups

- Mongo Atlas M10+ → automatic continuous backup, 7-day point-in-time restore.
- Manual snapshot before every schema-changing migration.
- Quarterly restore drill (post-launch).

## 8. Health checks

- `GET /health` returns `{status: 'ok'}` with no DB call (`app.ts:62-74`).
- Use Better Stack or UptimeRobot to ping every 1 minute. Alert if 2 consecutive fails.

## 9. Status page

- Use Statuspage.io or simple `<status.kalakaarian.com>` static page (Cloudflare Pages, manual update).
- Required for SEV1 incidents.

## 10. Logs

- Vercel Functions logs: 1-day retention on Hobby, 7 days on Pro. Promote to Pro before launch.
- Long-term log shipping: defer to v2 (Logtail/Better Stack, $9/mo).

## 11. Cost budget (target launch month)

| Item | Tier | Cost/mo |
|---|---|---|
| Vercel Pro | Pro | $20 |
| Mongo Atlas | M10 | $57 |
| Sentry | Team | $26 |
| PostHog | Free tier | $0 |
| Razorpay | Standard | 2% on txns |
| Resend | Free tier (3k/mo) | $0 |
| Cloudflare R2 | First 10GB free | $0 |
| Domain + SSL | Vercel | $0 |
| **Total fixed** | | **~$103/mo** |

If signups force PostHog above free tier (1M events/mo), upgrade or self-host. Acceptable above 10k MAU.

## 12. DR (disaster recovery)

- **Vercel down**: deploy bundle to a backup Render account (provision in advance, keep cold).
- **Mongo Atlas down**: read-only mode (cache GET endpoints in Cloudflare for 5 min). No write during outage. Restore from snapshot to a new cluster.
- **Razorpay down**: disable membership purchase UI; show banner.
- **Domain hijack**: DNS TTL 300s pre-launch; rotate to backup nameserver.
