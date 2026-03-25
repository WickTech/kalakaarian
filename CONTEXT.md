# Kalakariaan Project Context

**Last Updated:** 2026-03-25

## Project Overview

**Kalakariaan** is a D2C Influencer Marketplace connecting brands with micro-influencers for authentic marketing campaigns.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Container:** Docker + Docker Compose

## Project Structure

```
/home/rishi/github/kalakaarian/
├── server/              # Express API (port 5000)
│   ├── controllers/     # auth, campaign, proposal, influencer, cart
│   ├── routes/         # API route definitions
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # auth, error handling
│   └── utils/          # JWT helpers
├── src/                # React frontend (port 3000)
│   ├── pages/          # Landing, Login, Register, Marketplace
│   ├── components/    # UI components, Navbar, CartDrawer
│   ├── contexts/      # AuthContext
│   ├── hooks/         # useAuth, useCart, useTheme
│   └── api/           # API client functions
├── docs/               # API.md, ARCHITECTURE.md, deployment guides
├── models/             # Shared TypeScript models
└── infra/             # nginx.conf
```

## Current Status

| Component | Status |
|-----------|--------|
| Frontend | Partial - Pages exist, needs API integration |
| Backend | Partial - Core endpoints working |
| Database | Schema ready - MongoDB models defined |
| Docker | Configured |
| Docs | Complete |

## Features Implemented

- [x] User authentication (JWT)
- [x] Brand/Influencer role selection
- [x] Campaign CRUD
- [x] Proposal workflow
- [x] Shopping cart
- [ ] Escrow payment system
- [ ] Real-time messaging

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile

### Influencers
- GET /api/influencers
- GET /api/influencers/:id
- GET /api/influencers/search

### Campaigns
- GET /api/campaigns
- POST /api/campaigns
- PUT /api/campaigns/:id
- DELETE /api/campaigns/:id

### Proposals
- POST /api/campaigns/:id/proposals
- GET /api/campaigns/:id/proposals
- PUT /api/campaigns/proposals/:id/status

### Cart
- GET /api/cart
- POST /api/cart/add
- DELETE /api/cart/remove/:id

## Todo

1. **Frontend Agent** - Connect all pages to real API, build dashboards
2. **Backend Agent** - Complete missing endpoints, notifications, messaging
3. **Database Agent** - Setup MongoDB, seed data
4. **Testing Agent** - Write unit/integration tests
5. **Docs Agent** - Keep docs updated

## Key Files

- Frontend entry: `/home/rishi/github/kalakaarian/src/main.tsx`
- Backend entry: `/home/rishi/github/kalakaarian/server/app.ts`
- Database config: `/home/rishi/github/kalakaarian/server/config/database.ts`
- Docker compose: `/home/rishi/github/kalakaarian/docker-compose.yml`
- API docs: `/home/rishi/github/kalakaarian/docs/API.md`

## Notes

- Frontend currently uses mock data in `/src/data/mockInfluencers.ts`
- AuthContext needs to connect to real backend
- Cart functionality exists but needs full integration
- MongoDB connection string needs to be configured via environment
