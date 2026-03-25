# Architecture Documentation

## System Overview

Kalakariaan is a microservices-based D2C Influencer Marketplace designed for scalability and reliability.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                              │
│                      (nginx/docker)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Frontend │   │  Backend │   │  Socket  │
    │  (Vite)  │   │  (API)   │   │  Server  │
    │  :3000   │   │  :5000   │   │  :6000   │
    └──────────┘   └──────────┘   └──────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │     MongoDB         │
              │    (Database)       │
              └─────────────────────┘
```

---

## Component Architecture

### Frontend (kalakariaan-frontend)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Query + Zustand
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod

### Backend (kalakariaan-backend)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Mongoose (MongoDB)
- **Auth:** JWT + bcrypt

### Models (kalakariaan-models)
- User (brands & influencers)
- Campaign
- Proposal
- Cart
- Message

### Infrastructure (kalakariaan-infra)
- Docker & Docker Compose
- MongoDB container
- Environment configuration

---

## Data Flow Diagrams

### User Registration Flow
```
User -> Frontend -> [Validate] -> Backend API -> [Hash Password] -> MongoDB
                                                                    │
                                                                    ▼
User <- Frontend <- Backend API <- [Generate JWT] <----------------┘
```

### Campaign Creation Flow
```
Brand -> Create Campaign Form -> Validate -> API -> MongoDB (status: open)
                                    │
                                    ▼
                            WebSocket -> Notify Influencers
                                    │
                                    ▼
                            Search Index Update
```

### Proposal Workflow
```
Influencer -> Browse Campaign -> Submit Proposal -> API -> MongoDB
                                                     │
                                                     ▼
                                             Brand Dashboard
                                                     │
                                    ┌────────────────┴────────────────┐
                                    ▼                                 ▼
                              Accept                             Reject
                                    │                                 │
                                    ▼                                 ▼
                           Update Status                       Update Status
                                    │                                 │
                                    ▼                                 ▼
                           Payment Escrow                      Notify Influencer
```

### Checkout Flow
```
Brand -> Cart -> Review -> Initiate Payment -> Escrow Service
                                                   │
                                                   ▼
                                           Payment Gateway
                                                   │
                               ┌───────────────────┼───────────────────┐
                               ▼                                       ▼
                         Success                                   Failure
                               │                                       │
                               ▼                                       ▼
                    Update Order Status                     Rollback & Notify
                               │
                               ▼
                    Notify Influencer + Brand
```

---

## Database Schema Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  userType: "brand" | "influencer",
  name: String,
  avatar: String,
  bio: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Campaigns Collection
```javascript
{
  _id: ObjectId,
  brandId: ObjectId (ref: Users),
  title: String,
  description: String,
  niche: String,
  budget: Number,
  status: "open" | "in_progress" | "closed",
  deadline: Date,
  requirements: {
    posts: Number,
    platforms: [String],
    minFollowers: Number
  },
  createdAt: Date
}
```

### Proposals Collection
```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (ref: Campaigns),
  influencerId: ObjectId (ref: Users),
  pitch: String,
  proposedRate: Number,
  proposedPosts: Number,
  status: "pending" | "accepted" | "rejected",
  createdAt: Date
}
```

---

## Security Considerations

### Authentication & Authorization
- JWT tokens with 24h expiration
- Refresh token rotation
- Role-based access control (RBAC)
- Password hashing with bcrypt (10 rounds)

### API Security
- Rate limiting per endpoint
- Input validation with Zod
- SQL/NoSQL injection prevention
- CORS configuration
- Helmet.js security headers

### Data Protection
- Environment variables for secrets
- HTTPS enforcement in production
- Sensitive data encryption at rest
- Audit logging for sensitive operations

### Best Practices Implemented
- [ ] Input sanitization
- [ ] Output encoding
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Secure cookie settings
- [ ] File upload validation

---

## Infrastructure

### Docker Services
| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | React application |
| backend | 5000 | Express API |
| mongodb | 27017 | Database |
| redis | 6379 | Session cache (future) |

### Environment Variables
```
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongo:27017/kalakariaan
JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h

# Frontend
VITE_API_URL=http://localhost:5000/api
```

---

## Future Roadmap

### Phase 1 - MVP (Current)
- [x] User authentication
- [x] Brand/influencer profiles
- [x] Campaign CRUD
- [x] Proposal system
- [ ] Cart functionality

### Phase 2 - Enhanced Features
- [ ] Escrow payment system
- [ ] Real-time messaging (Socket.io)
- [ ] Campaign analytics
- [ ] Rating & review system
- [ ] Email notifications

### Phase 3 - Platform Growth
- [ ] Influencer verification
- [ ] Campaign templates
- [ ] A/B testing for campaigns
- [ ] Mobile apps (React Native)
- [ ] AI-powered matching

### Phase 4 - Enterprise
- [ ] White-label solutions
- [ ] API for third-party integrations
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Automated payouts

---

## Deployment Architecture (Production)

```
                    ┌──────────────────┐
                    │   CDN (CloudFlare)│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Load Balancer   │
                    │   (AWS ALB)       │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  Frontend     │   │   Backend     │   │   Backend     │
│  (S3 + CF)    │   │   (ECS Fargate)│   │   (ECS Fargate)│
└───────────────┘   └───────────────┘   └───────────────┘
                             │
                    ┌────────▼─────────┐
                    │     MongoDB      │
                    │   (Atlas Cluster)│
                    └──────────────────┘
```
