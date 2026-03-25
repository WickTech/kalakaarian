# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /auth/register

Register a new user (brand or influencer).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "userType": "brand" | "influencer",
  "name": "Brand Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ec49f1b2c8b1f4e3e1e1",
      "email": "user@example.com",
      "userType": "brand",
      "name": "Brand Name"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**
- `400` - Validation error / Email already exists
- `500` - Server error

---

### POST /auth/login

Authenticate user and receive JWT.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ec49f1b2c8b1f4e3e1e1",
      "email": "user@example.com",
      "userType": "brand"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**
- `401` - Invalid credentials
- `500` - Server error

---

### GET /auth/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e1",
    "email": "user@example.com",
    "userType": "brand",
    "name": "Brand Name",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Influencer Endpoints

### GET /influencers

List all influencers with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| niche | string | Filter by niche |
| minFollowers | number | Minimum follower count |
| maxFollowers | number | Maximum follower count |
| minEngagement | number | Minimum engagement rate |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "influencers": [
      {
        "id": "60d5ec49f1b2c8b1f4e3e1e2",
        "name": "Jane Doe",
        "email": "jane@influencer.com",
        "niche": "fashion",
        "followers": 25000,
        "engagementRate": 4.5,
        "platforms": ["instagram", "tiktok"],
        "avatar": "https://example.com/avatar.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### GET /influencers/:id

Get influencer details by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e2",
    "name": "Jane Doe",
    "email": "jane@influencer.com",
    "bio": "Fashion enthusiast sharing daily outfit inspiration",
    "niche": "fashion",
    "followers": 25000,
    "engagementRate": 4.5,
    "platforms": ["instagram", "tiktok"],
    "avatar": "https://example.com/avatar.jpg",
    "portfolio": ["https://example.com/work1.jpg"],
    "stats": {
      "totalCampaigns": 12,
      "avgReach": 50000,
      "rating": 4.8
    }
  }
}
```

**Error Codes:**
- `404` - Influencer not found

---

### GET /influencers/search

Advanced search with full-text capabilities.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query |
| niche | string | Filter by niche |
| location | string | Filter by location |
| minRate | number | Minimum rate per post |
| maxRate | number | Maximum rate per post |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "influencers": [...],
    "total": 45,
    "query": "fashion lifestyle"
  }
}
```

---

## Campaign Endpoints

### POST /campaigns

Create a new campaign (brands only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Summer Collection Launch",
  "description": "Looking for influencers to showcase our summer collection",
  "niche": "fashion",
  "budget": 5000,
  "deadline": "2024-06-30",
  "requirements": {
    "posts": 3,
    "platforms": ["instagram"],
    "minFollowers": 10000
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e3",
    "title": "Summer Collection Launch",
    "brandId": "60d5ec49f1b2c8b1f4e3e1e1",
    "status": "open",
    "proposalsCount": 0
  }
}
```

**Error Codes:**
- `403` - Only brands can create campaigns

---

### GET /campaigns

List campaigns (filtered by user role).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | open, closed, in_progress |
| niche | string | Filter by niche |
| minBudget | number | Minimum budget |
| maxBudget | number | Maximum budget |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "60d5ec49f1b2c8b1f4e3e1e3",
        "title": "Summer Collection Launch",
        "brand": {
          "id": "60d5ec49f1b2c8b1f4e3e1e1",
          "name": "StyleCo"
        },
        "budget": 5000,
        "status": "open",
        "proposalsCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

### GET /campaigns/:id

Get campaign details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e3",
    "title": "Summer Collection Launch",
    "description": "Looking for influencers...",
    "brand": {
      "id": "60d5ec49f1b2c8b1f4e3e1e1",
      "name": "StyleCo"
    },
    "budget": 5000,
    "deadline": "2024-06-30",
    "status": "open",
    "requirements": {
      "posts": 3,
      "platforms": ["instagram"],
      "minFollowers": 10000
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### PUT /campaigns/:id

Update campaign (brand owner only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "budget": 6000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /campaigns/:id

Delete campaign (brand owner only).

**Response (200):**
```json
{
  "success": true,
  "message": "Campaign deleted"
}
```

---

## Proposal Endpoints

### POST /campaigns/:id/proposals

Submit proposal for campaign (influencers only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "pitch": "I'd love to collaborate on this campaign...",
  "proposedRate": 500,
  "proposedPosts": 3,
  "contentIdeas": ["ootd post", "haul video", "review"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e4",
    "campaignId": "60d5ec49f1b2c8b1f4e3e1e3",
    "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `403` - Only influencers can submit proposals
- `400` - Already submitted proposal for this campaign

---

### GET /campaigns/:id/proposals

Get proposals for a campaign (brand owner only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "60d5ec49f1b2c8b1f4e3e1e4",
        "influencer": {
          "id": "60d5ec49f1b2c8b1f4e3e1e2",
          "name": "Jane Doe",
          "followers": 25000
        },
        "pitch": "I'd love to collaborate...",
        "proposedRate": 500,
        "status": "pending"
      }
    ]
  }
}
```

---

### PUT /proposals/:id/status

Update proposal status (brand owner only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "accepted" | "rejected"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e4",
    "status": "accepted"
  }
}
```

---

## Cart Endpoints

### POST /cart

Add item to cart.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
  "serviceType": "single_post",
  "rate": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cartId": "60d5ec49f1b2c8b1f4e3e1e5",
    "items": [
      {
        "influencer": {
          "id": "60d5ec49f1b2c8b1f4e3e1e2",
          "name": "Jane Doe"
        },
        "serviceType": "single_post",
        "rate": 500
      }
    ],
    "total": 500
  }
}
```

---

### GET /cart

Get current user's cart.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 1500
  }
}
```

---

### DELETE /cart/:itemId

Remove item from cart.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 1000
  }
}
```

---

### DELETE /cart

Clear entire cart.

**Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Rate Limiting

- Public endpoints: 100 requests/minute
- Auth endpoints: 5 requests/minute
- Cart endpoints: 30 requests/minute
