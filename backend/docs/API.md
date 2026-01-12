# AI Audio Studio Pro Backend API Documentation

## Overview

This document provides comprehensive documentation for the AI Audio Studio Pro backend API. The API is built with Cloudflare Workers and provides endpoints for user authentication, subscription management, token economy, and payment processing.

## Base URL

- **Production**: `https://api.aiaudiostudio.pro`
- **Staging**: `https://api-staging.aiaudiostudio.pro`
- **Development**: `http://localhost:8787`

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "tier": "basic",
    "subscription": {
      "id": "sub_123",
      "plan": "basic-monthly",
      "status": "active",
      "tokens": 500
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "profile": {
    "bio": "Audio engineer and producer",
    "company": "Audio Studio Pro",
    "website": "https://example.com",
    "location": "Los Angeles, CA"
  }
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_123",
  "newPassword": "NewPassword456!"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_123"
}
```

### Subscriptions

#### Get Available Plans
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "free-monthly",
      "name": "Free",
      "tier": "free",
      "billingCycle": "monthly",
      "price": 0,
      "currency": "USD",
      "tokens": 50,
      "features": ["Basic voice cloning", "Standard stem separation"]
    },
    {
      "id": "basic-monthly",
      "name": "Basic",
      "tier": "basic",
      "billingCycle": "monthly",
      "price": 19.99,
      "currency": "USD",
      "tokens": 500,
      "features": ["Advanced voice cloning", "Professional stem separation"]
    }
  ]
}
```

#### Get Current Subscription
```http
GET /api/subscriptions/current
Authorization: Bearer <token>
```

#### Create Subscription Checkout
```http
POST /api/subscriptions/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "basic-monthly",
  "trialPeriodDays": 14
}
```

**Response:**
```json
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/pay/cs_123"
}
```

#### Create Customer Portal Session
```http
POST /api/subscriptions/portal
Authorization: Bearer <token>
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "immediate": false
}
```

#### Update Subscription
```http
PUT /api/subscriptions/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPlanId": "premium-monthly"
}
```

#### Get Subscription History
```http
GET /api/subscriptions/history?page=1&limit=20
Authorization: Bearer <token>
```

### Tokens

#### Get Token Balance
```http
GET /api/tokens/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "balance": {
    "total": 500,
    "used": 87,
    "available": 413,
    "byType": {
      "voice_cloning": {
        "total": 300,
        "used": 45,
        "available": 255
      },
      "stem_separation": {
        "total": 200,
        "used": 42,
        "available": 158
      }
    }
  }
}
```

#### Get Token Transactions
```http
GET /api/tokens/transactions?page=1&limit=20&type=spent&tokenType=voice_cloning
Authorization: Bearer <token>
```

#### Get Available Token Packs
```http
GET /api/tokens/packs
```

**Response:**
```json
{
  "packs": [
    {
      "id": "starter-pack",
      "name": "Starter Pack",
      "tokens": 100,
      "price": 4.99,
      "currency": "USD",
      "bonusTokens": 0,
      "description": "Perfect for trying out our features"
    }
  ]
}
```

#### Purchase Token Pack
```http
POST /api/tokens/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenPackId": "starter-pack"
}
```

**Response:**
```json
{
  "purchaseId": "purchase_123",
  "clientSecret": "pi_123_secret",
  "amount": 499,
  "currency": "usd"
}
```

#### Use Tokens
```http
POST /api/tokens/use
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenType": "voice_cloning",
  "amount": 5,
  "description": "Voice cloning for podcast episode",
  "metadata": {
    "duration": 120,
    "quality": "high"
  }
}
```

#### Add Tokens (Admin)
```http
POST /api/tokens/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50,
  "type": "bonus",
  "tokenType": "voice_cloning",
  "description": "Loyalty bonus",
  "metadata": {
    "reason": "monthly_loyalty"
  }
}
```

#### Get Social Engagement Tasks
```http
GET /api/tokens/social
Authorization: Bearer <token>
```

**Response:**
```json
{
  "availableTasks": [
    {
      "platform": "twitter",
      "action": "follow",
      "tokens": 10,
      "description": "Follow our Twitter account",
      "verificationUrl": "https://twitter.com/aiaudiostudio"
    }
  ],
  "completedEngagements": [
    {
      "platform": "youtube",
      "action": "subscribe",
      "tokens": 20,
      "completedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Submit Social Engagement
```http
POST /api/tokens/social
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "twitter",
  "action": "follow",
  "verificationUrl": "https://twitter.com/user/status/123"
}
```

#### Get Usage Analytics
```http
GET /api/tokens/analytics?period=30d
Authorization: Bearer <token>
```

### Webhooks

#### Stripe Webhook
```http
POST /api/webhooks/stripe
Stripe-Signature: <signature>
Content-Type: application/json

{
  "id": "evt_123",
  "object": "event",
  "type": "customer.subscription.created",
  "data": { ... }
}
```

#### Retry Failed Webhooks
```http
POST /api/webhooks/retry
```

#### Get Webhook Status
```http
GET /api/webhooks/status?source=stripe&processed=false
```

### Premium Features

#### Get Premium Features
```http
GET /api/premium/features
Authorization: Bearer <token>
```

**Response:**
```json
{
  "features": [
    "Unlimited voice cloning",
    "Studio-quality stem separation",
    "Professional audio restoration",
    "Advanced voice effects",
    "4K video generation",
    "Priority support",
    "API access",
    "Batch processing",
    "Advanced analytics"
  ]
}
```

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "error": "Error message",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes  
- **Payment endpoints**: 5 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests per window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Time when the rate limit window resets

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}
```

### Subscription
```typescript
interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  tokensAllocated: number;
  tokensUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
}
```

### Token Transaction
```typescript
interface TokenTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased' | 'bonus' | 'refund';
  amount: number;
  tokenType: 'voice_cloning' | 'stem_separation' | 'voice_cleaning' | 'voice_changing' | 'video_generation';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

## SDK Integration

### JavaScript/TypeScript

```typescript
class AudioStudioAPI {
  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Tokens
  async getTokenBalance() {
    return this.request('/api/tokens/balance');
  }

  async useTokens(tokenType: string, amount: number, description?: string) {
    return this.request('/api/tokens/use', {
      method: 'POST',
      body: JSON.stringify({ tokenType, amount, description }),
    });
  }
}

// Usage
const api = new AudioStudioAPI('https://api.aiaudiostudio.pro', 'your-token');
const balance = await api.getTokenBalance();
```

## Testing

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure your environment variables
3. Run `npm run dev` for local development

### Example cURL Commands

```bash
# Register user
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Get token balance
TOKEN="your-jwt-token"
curl -X GET http://localhost:8787/api/tokens/balance \
  -H "Authorization: Bearer $TOKEN"
```

## Support

For API support and questions:
- Documentation: [API Docs](https://docs.aiaudiostudio.pro)
- Support Email: support@aiaudiostudio.pro
- Status Page: [status.aiaudiostudio.pro](https://status.aiaudiostudio.pro)

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- User authentication and management
- Subscription system with Stripe integration
- Token economy and usage tracking
- Social engagement rewards
- Webhook processing
- Rate limiting and security features