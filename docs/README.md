# Kalakariaan - D2C Influencer Marketplace

A platform connecting D2C brands with micro-influencers for authentic marketing campaigns.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Container:** Docker + Docker Compose

## Project Structure

```
├── kalakariaan-frontend/    # React frontend
├── kalakariaan-backend/     # Express API
├── kalakariaan-models/      # Mongoose schemas
└── kalakariaan-infra/       # Docker setup
```

## Quick Start

1. Clone all repositories
2. Run `docker-compose up -d` from kalakariaan-infra/
3. Access at http://localhost:3000

## Features

- [ ] Brand registration & campaign management
- [ ] Influencer profiles with analytics
- [ ] Marketplace with advanced filtering
- [ ] Proposal submission workflow
- [ ] Escrow payment system
- [ ] Real-time messaging
- [ ] Analytics dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/influencers | List influencers |
| POST | /api/campaigns | Create campaign |

[See full API docs](./API.md)
