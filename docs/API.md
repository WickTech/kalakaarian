# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /api/auth/register

Register a new user (brand or influencer).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "brand",
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
      "role": "brand",
      "name": "Brand Name"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**
| Code | Message |
|------|---------|
| 400 | Validation error / Email already exists |
| 500 | Server error |

---

### POST /api/auth/login

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
      "role": "brand"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**
| Code | Message |
|------|---------|
| 401 | Invalid credentials |
| 500 | Server error |

---

### GET /api/auth/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e1",
    "email": "user@example.com",
    "role": "brand",
    "name": "Brand Name",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### PUT /api/auth/profile

Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Updated Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e1",
    "email": "user@example.com",
    "role": "brand",
    "name": "Updated Name",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

## Influencer Endpoints

### GET /api/influencers

List all influencers with optional filters.

**Query Parameters:**
| Param | Type | Description | Default |
|-------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | Items per page | 20 |
| niche | string | Filter by niche | - |
| minFollowers | number | Minimum follower count | - |
| maxFollowers | number | Maximum follower count | - |
| minEngagement | number | Minimum engagement rate | - |

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

### GET /api/influencers/:id

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
| Code | Message |
|------|---------|
| 404 | Influencer not found |

---

### GET /api/influencers/search

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

### PUT /api/influencers/profile

Update influencer profile.

**Headers:** `Authorization: Bearer <token>` (influencer only)

**Request:**
```json
{
  "bio": "Updated bio",
  "niche": "lifestyle",
  "followers": 30000,
  "engagementRate": 5.0,
  "platforms": ["instagram", "tiktok", "youtube"],
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e2",
    "name": "Jane Doe",
    "bio": "Updated bio",
    "niche": "lifestyle",
    "followers": 30000,
    "engagementRate": 5.0,
    "platforms": ["instagram", "tiktok", "youtube"]
  }
}
```

---

## Campaign Endpoints

### GET /api/campaigns

List campaigns (filtered by user role).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | open, closed, in_progress |
| niche | string | Filter by niche |
| minBudget | number | Minimum budget |
| maxBudget | number | Maximum budget |
| page | number | Page number |
| limit | number | Items per page |

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

### GET /api/campaigns/:id

Get campaign details.

**Headers:** `Authorization: Bearer <token>`

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

### POST /api/campaigns

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
| Code | Message |
|------|---------|
| 403 | Only brands can create campaigns |
| 400 | Validation error |

---

### PUT /api/campaigns/:id

Update campaign (brand owner only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "budget": 6000,
  "status": "closed"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ec49f1b2c8b1f4e3e1e3",
    "title": "Updated Title",
    "budget": 6000,
    "status": "closed"
  }
}
```

---

### DELETE /api/campaigns/:id

Delete campaign (brand owner only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Campaign deleted"
}
```

---

### POST /api/campaigns/:id/proposals

Submit proposal for campaign (influencers only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "message": "I'd love to collaborate on this campaign...",
  "price": 500
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
| Code | Message |
|------|---------|
| 403 | Only influencers can submit proposals |
| 400 | Already submitted proposal for this campaign |

---

### GET /api/campaigns/:id/proposals

Get proposals for a campaign (brand owner only).

**Headers:** `Authorization: Bearer <token>`

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
        "message": "I'd love to collaborate...",
        "price": 500,
        "status": "pending"
      }
    ]
  }
}
```

---

### PUT /api/campaigns/proposals/:proposalId/status

Update proposal status (brand owner only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "accepted"
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

**Error Codes:**
| Code | Message |
|------|---------|
| 403 | Only brand owner can update proposal status |
| 404 | Proposal not found |

---

## Cart Endpoints

### GET /api/cart

Get current user's cart.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f4e3e1e1",
    "items": [
      {
        "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
        "influencer": {
          "id": "60d5ec49f1b2c8b1f4e3e1e2",
          "name": "Jane Doe"
        },
        "price": 500
      }
    ],
    "total": 500
  }
}
```

---

### POST /api/cart/add

Add item to cart.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
  "price": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f4e3e1e1",
    "items": [
      {
        "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
        "influencer": {
          "id": "60d5ec49f1b2c8b1f4e3e1e2",
          "name": "Jane Doe"
        },
        "price": 500
      }
    ],
    "total": 500
  }
}
```

**Error Codes:**
| Code | Message |
|------|---------|
| 400 | Validation error |
| 404 | Influencer not found |

---

### DELETE /api/cart/remove/:influencerId

Remove item from cart.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f4e3e1e1",
    "items": [],
    "total": 0
  }
}
```

---

### DELETE /api/cart/clear

Clear entire cart.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

### PUT /api/cart/update/:influencerId

Update cart item price.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price": 750
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f4e3e1e1",
    "items": [
      {
        "influencerId": "60d5ec49f1b2c8b1f4e3e1e2",
        "price": 750
      }
    ],
    "total": 750
  }
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

## Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- Public endpoints: 100 requests/minute
- Auth endpoints: 5 requests/minute
- Cart endpoints: 30 requests/minute
