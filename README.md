# Kalakariaan - D2C Influencer Marketplace

A Direct-to-Consumer (D2C) influencer marketplace connecting brands with micro-influencers for authentic marketing campaigns.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Container:** Docker + Docker Compose

## Project Structure

```
kalakaarian/
├── src/                 # React frontend
├── server/              # Express API backend
├── models/              # Mongoose database models
├── infra/               # Infrastructure configs (nginx)
├── docs/                # Documentation
└── docker-compose.yml    # Container orchestration
```

## Quick Start

### Prerequisites
- Docker Desktop installed
- Node.js 20+ (for local development)

### Using Docker (Recommended)

1. Clone the repository
2. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Start all services:
   ```bash
   docker-compose up -d
   ```
4. Access the app:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Local Development

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd server
npm install
npm run dev
```

## Features

- [x] User registration (Brand/Influencer)
- [x] Login with JWT authentication
- [x] Influencer marketplace with filters
- [x] Campaign creation & management
- [x] Proposal submission workflow
- [ ] Escrow payment system
- [ ] Real-time messaging
- [ ] Analytics dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get user profile |
| GET | /api/influencers | List influencers |
| GET | /api/influencers/:id | Get influencer |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns | List campaigns |
| POST | /api/cart | Manage cart |
| GET | /api/cart | Get cart |

See [docs/API.md](./docs/API.md) for full API documentation.

## Environment Variables

```env
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kalakariaan
JWT_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:5000/api
```

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines.

## License

MIT
