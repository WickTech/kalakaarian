# API Documentation

Base URL: `https://<project>.vercel.app/api` (production) or `http://localhost:4000/api` (local via `vercel dev`)

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Errors always return `{ message: string }`. Common HTTP codes:
| Code | Meaning |
|------|---------|
| 400 | Validation / bad input |
| 401 | Missing or invalid JWT |
| 403 | Wrong role or not resource owner |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 503 | DB unavailable |

---

## Health

### GET /health
No auth. Returns `{ status: "ok" }`. Safe to use as a readiness probe.

---

## Auth — `/api/auth`

### POST /api/auth/register
Register brand or influencer. Returns JWT on success.

```json
// Request
{
  "email": "user@example.com",
  "password": "s3cret",
  "name": "Riya",
  "role": "brand" | "influencer",
  // brand-only
  "companyName": "StyleCo",
  "industry": "Fashion",
  // influencer-only
  "city": "Mumbai",
  "niches": ["fashion"],
  "platform": ["instagram"],
  "tier": "micro",
  "bio": "...",
  "socialHandles": { "instagram": "handle" }
}
// Response 201
{ "message": "User registered successfully", "token": "...", "user": { "_id": "...", "role": "brand", "name": "Riya" } }
```

### POST /api/auth/login
Password login (email/username) or initiate phone-OTP login.

```json
// Password login
{ "email": "user@example.com", "password": "s3cret" }
// → 200 { "token": "...", "user": {...} }

// Phone OTP initiation
{ "phone": "+919876543210", "isPhoneLogin": true }
// → 200 { "message": "OTP sent", "phone": "+919876543210" }
```

### POST /api/auth/send-otp
Send OTP to phone (rate-limited per phone number).

```json
{ "phone": "+919876543210" }
// → 200 { "message": "OTP sent" }
```

### POST /api/auth/verify-otp
Verify OTP and receive JWT.

```json
{ "phone": "+919876543210", "otp": "123456" }
// → 200 { "token": "...", "user": { "_id": "...", "role": "influencer", "name": "..." } }
```

### POST /api/auth/google
Google ID token login / register.

```json
{ "jwtToken": "<google-id-token>" }
// → 200 { "token": "...", "user": { "_id": "...", "role": "brand", "name": "..." } }
```

### GET /api/auth/profile
**Auth required.** Returns current user.

```json
// → 200 { "_id": "...", "name": "Riya", "role": "brand", "email": "...", "phone": "...", ... }
```

### PUT /api/auth/profile
**Auth required.** Update user name or WhatsApp notification preferences.

```json
{ "name": "New Name" }
```

---

## Influencers — `/api/influencers`

### GET /api/influencers
List influencers. Public (optional auth). Results include `pricing` with **5% platform margin already applied**.

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default 1 |
| `limit` | number | default 20, max 100 |
| `tier` | string | `nano\|micro\|mid\|macro\|mega` |
| `platform` | string | `instagram\|youtube` |
| `city` | string | regex-escaped search |
| `q` | string | name/bio full-text |
| `gender` | string | `male\|female\|non_binary\|prefer_not_to_say` |
| `minFollowers` | number | |
| `maxFollowers` | number | |

```json
// → 200
{
  "influencers": [
    {
      "_id": "...",
      "name": "Priya",
      "bio": "...",
      "city": "Mumbai",
      "tier": "micro",
      "gender": "female",
      "platform": ["instagram"],
      "niches": ["fashion"],
      "isOnline": true,
      "lastSeenAt": "2026-04-20T10:00:00Z",
      "pricing": { "story": 2100, "reel": 5250, "post": 3150 },
      "verified": true
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 80, "pages": 4 }
}
```

### GET /api/influencers/tier-counts
Public. Returns count of influencers per tier.

```json
// → 200 { "nano": 12, "micro": 34, "mid": 8, "macro": 5, "mega": 1 }
```

### GET /api/influencers/:id
Public (optional auth). Populates `userId` with `name` only (no email).

```json
// → 200 { "influencer": { "_id": "...", "name": "...", "isOnline": false, "lastSeenAt": "...", ... } }
```

### PUT /api/influencers/profile
**Auth required (influencer).** Update own profile.

```json
{
  "bio": "...", "city": "Delhi", "niches": ["tech"],
  "platform": ["youtube"], "tier": "macro",
  "socialHandles": { "youtube": "mychannel" },
  "pricing": { "video": 10000 }
}
```

### PUT /api/influencers/presence
**Auth required (influencer).** Toggle online/offline status.

```json
{ "isOnline": true }
// → 200 { "message": "Presence updated", "isOnline": true, "lastSeenAt": "..." }
```

### PUT /api/influencers/:id/image
**Auth required (influencer, own profile).** Update profile image.

```json
{ "imageUrl": "https://..." }
```

### POST /api/influencers/connect-social
**Auth required (influencer).** Link Instagram or YouTube handle.

```json
{ "platform": "instagram", "handle": "my_handle" }
```

---

## Campaigns — `/api/campaigns`

### GET /api/campaigns/open
Public (optional auth). Lists open campaigns.

| Param | Type |
|-------|------|
| `niche` | string |
| `minBudget` | number |
| `maxBudget` | number |
| `page` | number |
| `limit` | number |

### GET /api/campaigns
**Auth required.** Brands see their own campaigns; influencers see open ones.

### GET /api/campaigns/:id
**Auth required.**

### POST /api/campaigns
**Auth required (brand).** Create campaign.

```json
{
  "title": "Summer Drop",
  "description": "...",
  "deliverables": "3 reels",
  "genre": ["fashion"],
  "platform": ["instagram"],
  "budget": 50000,
  "deadline": "2026-06-30",
  "requirements": "Min 10k followers"
}
// → 201 { "campaign": { "_id": "...", "status": "draft", ... } }
```

### PUT /api/campaigns/:id
**Auth required (brand owner).** Update campaign fields or status.

### DELETE /api/campaigns/:id
**Auth required (brand owner).**

### POST /api/campaigns/:id/proposals
**Auth required (influencer).** Submit proposal. Uses `bidAmount` (not `price`).

```json
{ "message": "I can deliver...", "bidAmount": 8000, "timeline": "2 weeks" }
// → 201 { "proposal": { "_id": "...", "status": "pending", "bidAmount": 8000, ... } }
```

### GET /api/campaigns/:id/proposals
**Auth required (brand owner).** List proposals for a campaign.

### PUT /api/campaigns/proposals/:proposalId/status
**Auth required (brand).** Accept or reject.

```json
{ "status": "accepted" | "rejected" }
```

---

## Proposals — `/api/proposals`

### GET /api/proposals/my
**Auth required (influencer).** My submitted proposals.

### GET /api/proposals/:id
**Auth required.**

### PUT /api/proposals/:id
**Auth required (influencer, own).** Update message/bidAmount while pending.

### DELETE /api/proposals/:id
**Auth required (influencer, own).** Delete pending proposal.

### POST /api/proposals/:id/respond
**Auth required (brand).** Accept or reject.

```json
{ "status": "accepted" | "rejected" }
```

---

## Campaign Files — `/api/campaigns`

### POST /api/campaigns/:campaignId/files
**Auth required.** Attach a file reference (URL) to campaign.

```json
{ "fileUrl": "https://...", "fileName": "brief.pdf", "fileType": "application/pdf" }
```

### GET /api/campaigns/:campaignId/files
**Auth required.**

### DELETE /api/campaigns/:campaignId/files/:fileId
**Auth required.**

---

## Campaign Workflow — `/api/campaigns`

### GET /api/campaigns/:campaignId/workflow
**Auth required.**

### PUT /api/campaigns/:campaignId/workflow/stage
**Auth required.**

```json
{ "stage": "brief_shared" | "content_creation" | "review" | "published" | "completed" }
```

### POST /api/campaigns/:campaignId/videos
**Auth required.** Add video submission to campaign.

### PUT /api/campaigns/:campaignId/videos/:videoIndex
**Auth required (brand).** Review video submission.

```json
{ "status": "approved" | "rejected", "feedback": "..." }
```

---

## Cart — `/api/cart`

All cart endpoints require auth except webhook.

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/cart` | required | Get cart |
| POST | `/api/cart/add` | required | Add influencer: `{ influencerId, price, campaignId? }` |
| DELETE | `/api/cart/remove/:influencerId` | required | Remove item |
| DELETE | `/api/cart/clear` | required | Clear cart |
| PUT | `/api/cart/update/:influencerId` | required | Update item: `{ campaignId, price }` |
| POST | `/api/cart/checkout` | required | Create Razorpay order (applies 8% platform fee). Returns `{ orderId, amount, currency, keyId }` |
| POST | `/api/cart/webhook` | none | Razorpay `payment.captured` webhook — advances approved proposals to `payment_released`. Idempotent. Requires raw body. |

---

## Membership — `/api/membership`

### POST /api/membership/purchase
**Auth required.**

```json
{ "tier": "silver" | "gold" }
// After Gold purchase, referral auto-grant logic runs server-side.
// Refetch /api/membership/status to surface any auto-upgrade.
```

### GET /api/membership/status
**Auth required.** Returns `{ tier: "regular" | "silver" | "gold", expiresAt?: "..." }`.

### PUT /api/membership/cancel
**Auth required.**

---

## Referrals — `/api/referrals`

### POST /api/referrals/generate
**Auth required.** Generate referral code (idempotent).

```json
// → 200 { "code": "ABC123" }
```

### POST /api/referrals/use
**Auth required.**

```json
{ "code": "ABC123" }
```

### GET /api/referrals/stats
**Auth required.**

```json
// → 200 { "code": "ABC123", "usedCount": 7, "goldUnlocked": false, "silverUnlocked": true }
```

---

## Notifications — `/api/notifications`

All require auth.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/notifications` | List all |
| GET | `/api/notifications/unread-count` | `{ count: number }` |
| PUT | `/api/notifications/:id/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete |

---

## Messages — `/api/messages`

All require auth.

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/messages/send` | `{ receiverId, content }` |
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/conversations/:id` | Get messages |
| PUT | `/api/messages/conversations/:id/read` | Mark read |

---

## Analytics — `/api/analytics`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/analytics/brand` | brand | Campaign metrics |
| GET | `/api/analytics/influencer` | influencer | Reach/engagement |
| GET | `/api/analytics/brand/deep` | brand | Stage breakdown, top campaigns, avg bid, completed count |
| GET | `/api/analytics/influencer/deep` | influencer | Completion rate, avg rating, stage breakdown |

---

## Videos — `/api/videos`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/videos` | influencer | `{ videoUrl, platform, campaignId? }` |
| GET | `/api/videos/my` | influencer | Own videos |
| GET | `/api/videos/campaign/:campaignId` | auth | Campaign videos |
| PUT | `/api/videos/:id/review` | brand | Review: `{ status, feedback? }` |

---

## Social Stats — `/api/social`

Public endpoints (no auth required).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/social/stats/:userId` | Combined stats |
| GET | `/api/social/instagram/:handle/posts` | `?limit=` |
| GET | `/api/social/youtube/:channelId/videos` | `?limit=` |
| GET | `/api/social/instagram/stats/:handle` | Follower/engagement |
| GET | `/api/social/youtube/stats/:channelId` | Subscriber/view stats |

Falls back to mock data when `INSTAGRAM_ACCESS_TOKEN` / `YOUTUBE_API_KEY` are absent.

---

## WhatsApp — `/api/whatsapp`

All auth required except webhook.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/whatsapp/status` | Notification preferences |
| PUT | `/api/whatsapp/preferences` | `{ enabled, campaigns, proposals, messages, payments }` |
| POST | `/api/whatsapp/send-test` | Send test message |
| GET | `/api/whatsapp/webhook` | WhatsApp webhook verification |
| POST | `/api/whatsapp/webhook` | Incoming message hook |

---

## Contact — `/api/contact`

### POST /api/contact
Public. Rate-limited: **5 req / hour / IP**. Returns 429 on breach.

```json
{ "name": "Riya", "email": "r@example.com", "message": "...", "type": "general" | "callback" | "business" }
```

### GET /api/contact
**Auth + admin required.** List submissions.

### PUT /api/contact/:id/status
**Auth + admin required.**

```json
{ "status": "open" | "resolved" | "in_progress" }
```

---

## Ratings — `/api/proposals`, `/api/influencers`

### POST /api/proposals/:id/rate
**Auth required (brand).** Submit a rating after workflow completes.

```json
{ "score": 1-5, "review": "optional text" }
// → 201 { "rating": { "id", "score", "review", "created_at" } }
```

### GET /api/proposals/:id/rating
**Auth required.** Fetch the rating for this proposal (null if not yet rated).

### GET /api/influencers/:id/ratings
Public. Returns all ratings + aggregate.

```json
// → 200 { "ratings": [...], "avg": 4.3, "count": 12 }
```

---

## Proposal Workflow — `/api/proposals/:id/workflow`

All actions require auth. Stage transitions are gated server-side.

### GET /api/proposals/:id/workflow
Auth required. Returns `{ proposal, workflow, logs }`.

### GET /api/proposals/:id/workflow/public
**No auth.** Sanitized read-only view for shared links.

### POST /api/proposals/:id/workflow/:action
Auth required. Valid actions:

| Action | Who | Description |
|--------|-----|-------------|
| `shortlist` | brand | Move to shortlisted |
| `accept` | brand | Accept proposal — gates on `budget > 0` AND `deadline` set |
| `start` | influencer | Begin content creation |
| `submit` | influencer | Submit content for review |
| `approve` | brand | Approve submitted content |
| `request-revision` | brand | Request content revision |
| `feedback` | brand | Leave feedback (any stage) |
| `mark-payment-pending` | brand | Mark payment initiated |
| `release-payment` | brand | Release payment |
| `reject` | brand/influencer | Reject / exit workflow |

---

## Recommendations — `/api/recommendations`

Both require auth.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/recommendations/creators` | brand | Top 6 creators matching brand's campaign niches |
| GET | `/api/recommendations/campaigns` | influencer | Top 6 open campaigns matching influencer's niches |

---

## Gamification — `/api/gamification`

### GET /api/gamification/influencer
**Auth required (influencer).** Returns XP, level, and full badge list.

```json
// → 200
{
  "xp": 120,
  "level": "Silver",
  "nextLevelXp": 300,
  "badges": [
    { "id": "rising_star", "name": "Rising Star", "emoji": "⭐", "description": "First accepted campaign", "earned": true },
    ...
  ]
}
```

### GET /api/gamification/influencer/:id/public
**No auth.** Returns only earned badges. `Cache-Control: public, max-age=60`.
