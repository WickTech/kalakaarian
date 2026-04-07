# Kalakariaan - D2C Influencer Marketplace
A Direct-to-Consumer (D2C) influencer marketplace connecting brands with micro-influencers for authentic marketing campaigns.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |

## Deployment

| Service | Platform | Cost |
|---------|----------|------|
| Frontend | [Vercel](./docs/VERCEL.md) | Free |
| Backend | [Railway](./docs/RAILWAY.md) | $0-5/mo |
| Database | [MongoDB Atlas](./docs/MONGODB.md) | Free (M0) |

**Total MVP Cost:** $0/month (within free tiers)

## Project Structure

```
kalakaarian/
├── src/                     # React frontend
│   ├── api/                 # API calls (axios)
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom hooks
│   ├── components/          # UI components
│   └── pages/               # Page components
├── server/                   # Express API backend
│   ├── config/              # Configuration
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, validation, errors
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── utils/               # Helpers
├── models/                   # Shared database schemas
├── infra/                   # Infrastructure (nginx)
├── docs/                    # Documentation
└── docker-compose.yml       # Local development
```

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local) or Atlas |

### 1. Clone & Install

```bash
git clone https://github.com/WickTech/kalakaarian.git
cd kalakaarian
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/kalakariaan
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Start Development

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local**
```bash
# Terminal 1: Backend
cd server && npm install && npm run dev

# Terminal 2: Frontend
npm run dev
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| MongoDB | localhost:27017 |

### 5. Google OAuth Setup

Follow the [Google OAuth Setup Guide](./docs/GOOGLE_OAUTH_SETUP.md) to:
1. Create Google Cloud project
2. Enable OAuth API
3. Get credentials
4. Configure redirect URIs

## Deployment Guide

1. **[MongoDB Atlas Setup](./docs/MONGODB.md)** - Create free database
2. **[Railway Backend Deploy](./docs/RAILWAY.md)** - Deploy Express API
3. **[Vercel Frontend Deploy](./docs/VERCEL.md)** - Deploy React app
4. **[Google OAuth Setup](./docs/GOOGLE_OAUTH_SETUP.md)** - Configure Google Login

## Features

### MVP Features
- [x] User registration (Brand/Influencer)
- [x] Login with JWT authentication
- [x] Influencer marketplace with filters
- [x] Campaign creation & management
- [x] Proposal submission workflow
- [x] Cart system

### Future Features
- [ ] Escrow payment system
- [ ] Real-time messaging
- [ ] Analytics dashboard
- [ ] Social media integrations

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/profile` | Get user profile |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/open` | List open campaigns (public) |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Proposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:id/proposals` | Submit proposal |
| GET | `/api/campaigns/:id/proposals` | Get campaign proposals |
| GET | `/api/proposals/my` | My proposals |
| PUT | `/api/proposals/:id/status` | Update proposal status |

### Influencers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/influencers` | List influencers |
| GET | `/api/influencers/:id` | Get influencer |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/add` | Add to cart |
| DELETE | `/api/cart/remove/:id` | Remove from cart |

See [docs/API.md](./docs/API.md) for full documentation.

## Environment Variables

See [.env.example](./.env.example) for all variables.

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines.

## License

MIT
# trigger redeploy
