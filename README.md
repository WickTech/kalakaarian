
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

## Deployment Guide

1. **[MongoDB Atlas Setup](./docs/MONGODB.md)** - Create free database
2. **[Railway Backend Deploy](./docs/RAILWAY.md)** - Deploy Express API
3. **[Vercel Frontend Deploy](./docs/VERCEL.md)** - Deploy React app

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
| GET | `/api/auth/profile` | Get user profile |

### Influencers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/influencers` | List influencers |
| GET | `/api/influencers/:id` | Get influencer |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |

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
