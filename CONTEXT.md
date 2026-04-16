# Kalakaarian - Project Context

**Last Updated:** 2026-04-17

---

## Project Overview

**Kalakaarian** is India"s First AI-Powered Influencer Marketplace connecting brands with micro-influencers for authentic marketing campaigns.

---

## User Flow (Updated)

```
Landing Page
    ↓
Login / Sign Up (Email + Password + Google Auth)
    ↓
┌────────────────────┬────────────────────┐
│      BRAND         │    INFLUENCER      │
├────────────────────┼────────────────────┤
│ • Browse Influencers│ • Browse Campaigns │
│ • Create Campaign  │ • Submit Proposal  │
│ • Manage Campaigns │ • Dashboard        │
│ • View Proposals   │ • Profile          │
│ • Accept/Reject    │ • Chat             │
└────────────────────┴────────────────────┘
```

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose (Atlas free tier)
- **Auth:** JWT (Email/Password) + Google OAuth 2.0
- **Deployment:** Vercel (frontend + backend serverless)

---

## Current Status (2026-04-17)

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ | All pages working |
| Backend | ✅ | All APIs working |
| MongoDB | ✅ | Connected (Atlas free tier) |
| Deployment | ✅ | Vercel (frontend + backend serverless) |
| Seed Data | ✅ | 5 influencers, 3 brands, 4 campaigns, 5 proposals |

---

## Recent Fixes (2026-04-17)

### ✅ Step 1: Back Button Fix
- Created `useNavigateBack` hook with fallback navigation
- Updated back buttons in ContactPage, InfluencerProfile, Messages
- Fixed navigation to fall back to sensible default routes

### ✅ Step 2: Campaign File Upload in CreateCampaign
- Added file upload capability to campaign creation form
- Files saved as URLs (Google Drive, Dropbox, etc.)
- Supports brief, contract, other file types

### ✅ Step 3: WhatsApp Integration
- Created WhatsApp Business API service (`server/src/services/whatsapp.ts`)
- Added WhatsApp notification preferences to User model
- API routes for status, preferences, test messages, webhooks

### ✅ Step 4: Instagram/YouTube Integration
- Enhanced social media service with real API support
- Social stats API routes for followers, posts, videos
- Frontend updated to display real social stats

### ✅ Step 5: Analytics Improvements
- Created analytics calculation service
- Analytics now use real data from social media APIs
- Updated InfluencerProfile with real engagement metrics

### ✅ Step 6: New Influencer Visibility
- Fixed API response mismatch for influencer listing
- Marketplace now shows real influencers from database
- Handle array platform type in filters

### ✅ Step 7: Fixes from Feature Audit
- **Cart sync with backend** - Cart now persists across refreshes
- **Analytics dashboard UI** - Brand/Influencer dashboards show real stats
- **Contact form backend** - Messages saved to database

---

## Known Issues (Still Pending)

1. **Real-time messaging** - Uses polling (5s), not WebSocket
2. **File upload** - URLs only, no actual file storage
3. **Social media API** - Mock data fallback, needs API keys for real data:
   - `YOUTUBE_API_KEY`
   - `INSTAGRAM_ACCESS_TOKEN`
4. **WhatsApp API** - Needs API keys:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Brand | `brand@techcorp.com` | `password123` |
| Influencer | `sarah@creator.com` | `password123` |
| Influencer | `raj@creator.com` | `password123` |

---

## Full Website Audit Status

### Frontend Pages - Status
| Page | Status | Notes |
|------|--------|-------|
| Landing.tsx | ✅ Working | Dynamic tier counts |
| LoginPage.tsx | ✅ Working | Login + Signup |
| RoleSelectPage.tsx | ✅ Working | Role selection |
| InfluencerRegisterPage.tsx | ✅ Working | Profile image upload |
| BrandRegisterPage.tsx | ✅ Working | Registration |
| Marketplace.tsx | ✅ Working | Filters, cart |
| BrandDashboard.tsx | ✅ Working | Campaigns, proposals, analytics |
| InfluencerDashboard.tsx | ✅ Working | Proposals, profile, analytics |
| BrowseCampaigns.tsx | ✅ Working | Open campaigns |
| CampaignDetails.tsx | ✅ Working | Campaign info |
| SubmitProposal.tsx | ✅ Working | Proposal form |
| CreateCampaign.tsx | ✅ Working | File upload |
| Messages.tsx | ✅ Working | Chat UI |
| ContactPage.tsx | ✅ Working | Form, chatbot, callback |
| InfluencerProfile.tsx | ✅ Working | Social stats, analytics |

### Backend API - Status
| Endpoint | Status |
|----------|--------|
| Auth | ✅ Working |
| Campaigns CRUD | ✅ Working |
| Proposals CRUD | ✅ Working |
| Influencers | ✅ Working |
| Messages | ✅ Working |
| Analytics | ✅ Working |
| Cart | ✅ Working |
| Notifications | ✅ Working |
| WhatsApp | ✅ Working |
| Social Stats | ✅ Working |
| Contact | ✅ Working |

---

## Environment Variables Needed

### Backend (.env)
```
MONGODB_URI=mongodb+srv://kalakariaan_admin:WLnsNGZLkGuYFdGE@kalakariaan-cluster.4hamors.mongodb.net/?appName=kalakariaan-cluster
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional - for real API data
YOUTUBE_API_KEY=your_youtube_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
```

### Frontend (.env)
```
VITE_API_URL=https://kalakaarian-server.vercel.app
```

---

## Project Structure

```
kalakaarian/
├── client/                    # Frontend (Vite + React)
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # React hooks (useCart, useAuth, useTheme, useNavigateBack)
│   │   ├── lib/              # API client (api.ts)
│   │   └── components/      # UI components
│   └── vercel.json
└── server/                   # Backend (Express + TypeScript)
    ├── src/
    │   ├── routes/           # API endpoints
    │   ├── controllers/     # Business logic
    │   ├── models/           # MongoDB models
    │   ├── services/         # Services (whatsapp, socialMedia, analytics)
    │   └── middleware/       # Auth, validation
    └── vercel.json
```

---

## How to Run Locally

```bash
cd /home/rishi/github/kalakaarian

# Install dependencies
pnpm install

# Seed database (first time)
cd server && pnpm seed

# Frontend
cd client && pnpm dev

# Backend
cd server && pnpm dev
```

---

## How to Seed Database

```bash
cd /home/rishi/github/kalakaarian/server

# Create .env with MONGODB_URI
echo "MONGODB_URI=mongodb+srv://..." > .env

# Run seed
pnpm seed
```

---

## Tomorrow's Tasks (2026-04-18)

1. Test all features on deployed site
2. Real-time messaging (WebSocket vs polling)
3. File upload actual storage (Cloudinary/S3)
4. Social media real API integration (need API keys)
5. Payment integration

---

*Context saved for future session resume.*
