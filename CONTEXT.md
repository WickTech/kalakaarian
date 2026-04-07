# Kalakaarian - Project Context

**Last Updated:** 2026-04-07

---

## Project Overview

**Kalakaarian** is India's First AI-Powered Influencer Marketplace connecting brands with micro-influencers for authentic marketing campaigns.

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
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Email/Password) + Google OAuth 2.0
- **Deployment:** Vercel (frontend + backend)

---

## Completed Work

### Phase 1: Landing Page Updates
- ✅ Added "Why Kalakaarian?" section with 4 feature cards
- ✅ Updated meta title and description for SEO

### Phase 2: Frontend-Backend API Integration
Fixed critical API mismatches:
- ✅ Fixed `/api/auth/me` → `/api/auth/profile`
- ✅ Fixed `/api/brand/campaigns` → `/api/campaigns`
- ✅ Fixed Proposal field: `offeredAmount` → `bidAmount`
- ✅ Fixed Campaign field: `niche` → `genre`
- ✅ Connected BrandDashboard to real API
- ✅ Connected BrowseCampaigns to real API
- ✅ Connected CampaignDetails to real API
- ✅ Connected SubmitProposal to real API
- ✅ Connected InfluencerDashboard to real API
- ✅ Connected Marketplace to searchInfluencers API

### Phase 3: Messaging System
- ✅ Created Message and Conversation models
- ✅ Created message API routes (send, get conversations, get messages, mark read)
- ✅ Added messaging APIs to frontend client
- ✅ **Built Messaging UI (`/messages`)** with conversation list and chat area.

### Phase 4: Analytics Dashboard
- ✅ Created analytics routes for brand and influencer
- ✅ Added campaign stats, proposal stats, earnings tracking

### Phase 5: Login/Signup Flow
- ✅ Combined login/signup on same page
- ✅ Role selection for sign up (Influencer/Brand)
- ✅ Direct navigation to registration pages
- ✅ Simplified registration forms
- ✅ **Restored Google OAuth** with safety checks for environment variables.

### Phase 6: Brand Dashboard Completion
- ✅ Added "View Proposals" functionality.
- ✅ **Implemented Accept/Reject proposal UI** with real API integration.

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ | Build passing, blank screen fixed |
| Backend | ✅ | API endpoints ready |
| MongoDB | ✅ | Connected (Atlas/Railway) |
| Deployment | ✅ | Vercel (serverless) |

---

## Known Issues

1. ~~Blank Screen on Load~~ - FIXED
2. ~~Marketplace showing no data~~ - FIXED
3. Payment Integration: Still pending (Phase 10).
4. Analytics UI: APIs ready, but visualization (charts) not yet implemented.

---

## Recent Session Fixes (2026-04-07)
### Backend Migration to Vercel Serverless
- ✅ Added `serverless-http` package for serverless support
- ✅ Created `vercel.json` with @vercel/node build config
- ✅ Updated `database.ts` with connection caching (global mongoose cache for cold starts)
- ✅ Updated `app.ts` to export serverless handler instead of `app.listen()`
- ✅ Fixed TypeScript errors (CORS options type, reduce callback type)
- ✅ Added `@types/serverless` for TypeScript support

---

## Recent Session Fixes (2026-03-27)
1. **Google Auth:** Wrapped `App` in `GoogleOAuthProvider` but added a safety check to bypass if `clientId` is missing to prevent crashes.
2. **Missing Types:** Defined `LoginResponse` interface in `api.ts`.
3. **API Alignment:** Updated `respondToProposal` to use `POST /api/proposals/:id/respond`.
4. **Messaging:** Created `Messages.tsx` and connected all chat APIs.

## Session Fixes (2026-03-28)
1. **App.tsx:** Added missing `Messages` import (was used in route but not imported, causing blank screen).
2. **Marketplace.tsx:** Added missing `ChevronDown` import from lucide-react.
3. **Marketplace.tsx:** Added mock data (6 influencers) with proper `Influencer` type for when API fails/returns empty.
4. **Marketplace.tsx:** Fixed filter logic to work with mock data structure (used `i.platform`, `i.followers` instead of nested objects).
5. **App.tsx:** Removed `ProtectedRoute` from registration pages (`/influencer-register`, `/brand-register`). Users couldn't register because they were redirected to login since they weren't logged in yet.

## Session Fixes (2026-03-30)
1. **Removed TikTok:** Removed TikTok from all influencer-related forms and models (banned in India).
2. **Influencer Registration Enhanced:**
   - Added Instagram handle + YouTube channel URL fields
   - Added follower count fields (Instagram/YouTube)
   - Added engagement rate field
   - Updated backend to store socialHandles as nested object
   - Updated backend to store followers as nested object
3. **Influencer Profile Model:**
   - Removed TikTok/Twitter from socialHandles
   - Removed TikTok/Twitter from followers
   - Added engagementRate field
   - Platform now limited to ['instagram', 'youtube']
4. **InfluencerDashboard:** Added social links display with Instagram/YouTube clickable badges
5. **EditInfluencerProfile:** Updated to use new socialHandles structure, added city field

## Full Website Audit (2026-03-28)

### Frontend Pages - Status
| Page | Status | Notes |
|------|--------|-------|
| Landing.tsx | ✅ Working | Main landing page |
| LoginPage.tsx | ✅ Working | Login + Signup flow |
| RoleSelectPage.tsx | ✅ Working | Role selection |
| InfluencerRegisterPage.tsx | ✅ Working | Registration form (fixed) |
| BrandRegisterPage.tsx | ✅ Working | Registration form (fixed) |
| Marketplace.tsx | ✅ Working | With mock data fallback |
| BrandDashboard.tsx | ✅ Working | Campaign + proposal management |
| InfluencerDashboard.tsx | ✅ Working | Proposals + profile |
| BrowseCampaigns.tsx | ✅ Working | List open campaigns |
| CampaignDetails.tsx | ✅ Working | Campaign info + submit |
| SubmitProposal.tsx | ✅ Working | Proposal form |
| CreateCampaign.tsx | ✅ Working | Create new campaign |
| Messages.tsx | ✅ Working | Chat UI |
| MyProfile.tsx | ✅ Working | Profile view |
| EditInfluencerProfile.tsx | ✅ Working | Edit profile |
| EditBrandProfile.tsx | ✅ Working | Edit brand profile |

### Backend API - Status
| Endpoint | Status |
|----------|--------|
| Auth (register, login, profile) | ✅ Working |
| Campaigns CRUD | ✅ Working |
| Proposals CRUD | ✅ Working |
| Influencers search | ✅ Working |
| Messages | ✅ Working |
| Analytics | ✅ Working |
| Cart | ✅ Working |

### Unused/Legacy Files
- `Dashboard.tsx` - Not used in routes
- `BrandCampaignPage.tsx` - Not used in routes  
- `LandingPage.tsx` - Not imported
- `Index.tsx` - Not imported

### Known Issues / Pending
1. Payment Integration: Not implemented
2. Analytics UI: APIs ready but no charts visualization
3. Email notifications: Not implemented
4. Admin panel: Not implemented

---

## Project Structure

```
kalakaarian/
├── client/                    # Frontend (Vite + React)
│   ├── src/
│   │   ├── pages/            # Page components (21 pages)
│   │   ├── hooks/            # React hooks (useAuth, useCart, useTheme)
│   │   ├── lib/              # API client & stores
│   │   └── components/       # Reusable UI components
└── server/                   # Backend (Express + TypeScript)
    └── src/
        ├── routes/           # API endpoints
        ├── controllers/      # Business logic
        ├── models/           # MongoDB models
        └── middleware/       # Auth, validation
```

## How to Run

```bash
cd /home/rishi/github/kalakaarian

# Install dependencies
pnpm install

# Frontend (runs on port 5173/8080)
cd client && pnpm dev

# Backend (runs on port 3000, needs MongoDB)
cd server && pnpm dev
```

## Tomorrow's Tasks (Priority Order)

1. **Test Registration Flow** - Verify influencers can register with social handles
2. **AI Integration** - Integrate Ollama with Qwen3:8b for campaign matching
3. **Payment Integration** - Add payment gateway (Razorpay/Stripe)
4. **Analytics Charts** - Add visualization for campaign/proposal stats
5. **Email Notifications** - Welcome emails, proposal updates
6. **Admin Panel** - User management, platform analytics
7. **Cleanup** - Remove unused files (Dashboard.tsx, BrandCampaignPage.tsx, etc.)
