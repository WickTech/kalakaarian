# Kalakaarian - Project Context

**Last Updated:** 2026-04-17 (Evening)

---

## Project Overview

**Kalakaarian** is India's First AI-Powered Influencer Marketplace connecting brands with micro-influencers for authentic marketing campaigns.

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose (Atlas free tier)
- **Auth:** JWT (Email/Password) + Google OAuth 2.0
- **Deployment:** Vercel (frontend + backend serverless)

---

## Current Status (2026-04-17)

| Component | Status |
|-----------|--------|
| Frontend | ✅ Working |
| Backend | ✅ Working |
| MongoDB | ✅ Connected (Atlas) |
| Deployment | ✅ Vercel |
| Seed Data | ✅ 14 influencers, 1 brand, 1 campaign |

---

## Today's Progress (2026-04-17)

### Fixed Issues
1. **Blank page error** - Fixed `useAuth` hook error by moving `useCart` inside `AuthProvider`
2. **Removed mock data** - Marketplace now shows only real influencers from database
3. **Added 14 real influencers** - Including 9 from Surat, Gujarat

### Database Seed Data
- **1 Brand** (login: `brand@techcorp.com` / `password123`)
- **14 Influencers** (12 display-only, 2 with login)
- **1 Campaign**
- **1 Proposal**

### Influencers Added (Surat, Gujarat)
1. Sambhav Khatang (@imazikyt)
2. Kaksha Sarvani (@kakshaaaaaa)
3. Dhruvisha Jariwala (@thedhruvishajariwala)
4. Riya Lekhadiya (@ria_aarel)
5. Heer Darshan (@heer_darshan)
6. Jiya Khurana (@jiyakhuranaa)
7. Jaydip Patel (@jaydip.123)
8. Aarvi Arnav (@arnav__aarvi)
9. Drishti Patel (@drashti.ghanva)

---

## All Pages Working

| Page | Status |
|------|--------|
| Landing | ✅ |
| Marketplace | ✅ |
| Login/Register | ✅ |
| Brand Dashboard | ✅ |
| Influencer Dashboard | ✅ |
| Browse Campaigns | ✅ |
| Messages | ✅ |
| Contact | ✅ |

---

## Known Issues (Pending)

1. **Real-time messaging** - Uses polling (5s), not WebSocket
2. **File upload** - URLs only, no actual storage
3. **Social media API** - Needs API keys for real data
4. **WhatsApp API** - Needs API keys

---

## Environment Variables

### Backend
```
MONGODB_URI=mongodb+srv://kalakariaan_admin:WLnsNGZLkGuYFdGE@kalakariaan-cluster.4hamors.mongodb.net/?appName=kalakariaan-cluster
```

### Frontend
```
VITE_API_URL=https://kalakaarian-server.vercel.app
```

---

## How to Seed Database

```bash
cd /home/rishi/github/kalakaarian/server
pnpm seed
```

---

## Tomorrow's Tasks

1. Verify marketplace shows all 14 influencers
2. Test login with brand account
3. Test influencer registration flow
4. Real-time messaging implementation
5. File upload storage (Cloudinary)

---

*Context saved for future session resume.*
