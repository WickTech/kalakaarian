# Kalakariaan Project Context

**Last Updated:** 2026-03-26

---

## Project Overview

**Kalakariaan** is a D2C Influencer Marketplace connecting brands with micro-influencers for authentic marketing campaigns.

## User Flow

```
Landing Page (Product Info)
    ↓
Login/Register (Google OAuth)
    ↓
Role Selection (Brand / Influencer)
    ↓
┌────────────────────┬────────────────────┐
│      BRAND         │    INFLUENCER      │
├────────────────────┼────────────────────┤
│ • Browse Influencers│ • View Campaigns   │
│ • Create Campaign  │ • Submit Proposal  │
│ • Manage Campaigns │ • Dashboard       │
└────────────────────┴────────────────────┘
```

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose (Railway)
- **Auth:** Google OAuth 2.0 + JWT
- **Deployment:** Vercel (frontend) + Railway (backend)

---

## Project Structure (Monorepo)

```
/home/rishi/github/kalakaarian/
├── client/              # Frontend (Vite + React)
├── server/              # Backend (Express)
├── packages/models/     # Shared TypeScript types
├── docs/                # Documentation
└── .env.example         # Environment variables template
```

**GitHub Repo:** https://github.com/WickTech/Kalakaarian

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ | Landing page works, Google OAuth UI added |
| Backend | ✅ | Google OAuth endpoints added |
| Google OAuth | 🔄 | Testing - credentials configured, awaiting verification |
| Database | ✅ | Models ready with indexes |
| Deployment | ✅ | Vercel + Railway |

---

## Google OAuth Setup (Completed)

### Step 1: Google Cloud Project
- Created project: `kalakaarian`

### Step 2: OAuth Credentials
- Created OAuth client ID
- Configured consent screen (External)
- Added authorized domains
- Added redirect URIs:
  - `https://kalakaarian-production.up.railway.app/api/auth/google/callback`
  - `http://localhost:4000/api/auth/google/callback`

### Step 3: Environment Variables

**Backend (Railway):**
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅
- `GOOGLE_CALLBACK_URL` ✅
- `MONGODB_URI` ✅
- `JWT_SECRET` ✅

**Frontend (Vercel):**
- `VITE_GOOGLE_CLIENT_ID` ✅
- `VITE_API_URL` ✅

---

## Next Steps

### Immediate
1. **Test Google OAuth** - Wait for Google settings to propagate (up to few hours)
2. **Verify login works** - Try signing in with Google
3. **Handle role selection** - After login, user picks Brand or Influencer

### Phase 2: Core Features
1. **Brand Dashboard** - Browse influencers, create campaigns
2. **Influencer Dashboard** - View campaigns, submit proposals
3. **Campaign Management** - Full CRUD for brands
4. **Proposal System** - Submit, accept, reject proposals

### Phase 3: Enhancements
1. **Profile Management** - Edit brand/influencer profiles
2. **Search & Filter** - Better influencer search
3. **Messaging** - Chat between brand and influencer
4. **Analytics** - Campaign performance tracking

---

## Environment Variables Reference

### Backend (Railway)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://kalakaarian-production.up.railway.app/api/auth/google/callback
PORT=4000
```

### Frontend (Vercel)
```
VITE_API_URL=https://kalakaarian-production.up.railway.app
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

---

## API Endpoints

### Auth
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/register` - Email registration
- `POST /api/auth/login` - Email login
- `GET /api/auth/profile` - Get current user

### Campaigns
- `GET /api/campaigns` - List brand's campaigns (brand only)
- `POST /api/campaigns` - Create campaign (brand only)
- `GET /api/campaigns/open` - List open campaigns (influencer)
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Proposals
- `POST /api/proposals` - Submit proposal (influencer)
- `GET /api/proposals/my` - My proposals (influencer)
- `GET /api/campaigns/:id/proposals` - Proposals for campaign (brand)
- `PUT /api/proposals/:id/respond` - Accept/reject (brand)

### Influencers
- `GET /api/influencers` - Search/filter influencers

---

## Key Files

- **Frontend Entry:** `client/src/main.tsx`
- **Backend Entry:** `server/src/app.ts`
- **Auth Hook:** `client/src/hooks/useAuth.tsx`
- **API Client:** `client/src/lib/api.ts`
- **User Model:** `server/src/models/User.ts`

---

## Commands

```bash
# Navigate to project
cd /home/rishi/github/kalakaarian

# Install dependencies
cd client && npm install

# Run frontend locally
cd client && npm run dev

# Run backend locally
cd server && npm run dev

# Build frontend
cd client && npm run build

# Run tests
npm test
```

---

## Troubleshooting

### Google OAuth Error: invalid_client
- Check Client ID matches exactly in Vercel and Google Cloud Console
- Wait 5 minutes to few hours for OAuth settings to propagate
- Ensure authorized domains and redirect URIs are added
- Add test user email in OAuth consent screen if in "Testing" mode