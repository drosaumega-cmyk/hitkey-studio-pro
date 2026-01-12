# AI Audio Studio Pro Backend

A comprehensive backend API for AI Audio Studio Pro, built with Cloudflare Workers, TypeScript, and Stripe integration.

## Features

- **User Authentication**: JWT-based authentication with secure password handling
- **Subscription Management**: Multi-tier subscription system with Stripe integration
- **Token Economy**: Flexible token-based usage system with purchases and rewards
- **Payment Processing**: Complete Stripe integration for subscriptions and one-time purchases
- **Social Engagement**: Token rewards for social media interactions
- **Analytics**: Usage tracking and analytics
- **Webhooks**: Robust webhook handling for payment events
- **Rate Limiting**: Configurable rate limiting for API protection
- **Audit Logging**: Comprehensive audit trail for all user actions

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV (sessions, cache)
- **Payments**: Stripe
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas

## Project Structure

```
backend/
├── src/
│   ├── handlers/           # API route handlers
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── subscriptions.ts # Subscription management
│   │   ├── tokens.ts      # Token management
│   │   └── webhooks.ts    # Webhook handlers
│   ├── lib/               # Core libraries
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── database.ts    # Database and KV services
│   │   └── payments.ts    # Stripe integration
│   ├── middleware/        # Request middleware
│   │   ├── auth.ts        # Authentication middleware
│   │   ├── cors.ts        # CORS handling
│   │   ├── rateLimit.ts   # Rate limiting
│   │   └── validation.ts  # Request validation
│   └── index.ts           # Application entry point
├── migrations/            # Database migrations
├── sql_logs/             # SQL query logs
├── config/               # Environment configurations
├── tests/                # Test files
├── infra/                # Infrastructure as code
├── wrangler.toml         # Cloudflare Workers config
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare account
- Stripe account
- Wrangler CLI

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - Set your Stripe keys
   - Configure JWT secret
   - Set your domain URLs

### Database Setup

1. Create D1 database:
```bash
wrangler d1 create ai-audio-studio-db
```

2. Update `wrangler.toml` with your database ID

3. Run migrations:
```bash
npm run db:migrate
```

4. (Optional) Seed with sample data:
```bash
npm run db:seed
```

### KV Storage Setup

1. Create KV namespaces:
```bash
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "CACHE"
```

2. Update `wrangler.toml` with KV namespace IDs

### Stripe Configuration

1. Create Stripe account and get API keys
2. Configure webhooks in Stripe dashboard:
   - Endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_*`, `payment_intent.*`, `checkout.session.completed`

### Development

1. Start development server:
```bash
npm run dev
```

2. Test API endpoints locally

### Deployment

1. Deploy to staging:
```bash
npm run deploy:staging
```

2. Deploy to production:
```bash
npm run deploy:prod
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email

### Subscription Endpoints

- `GET /api/subscriptions/plans` - Get available plans
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/checkout` - Create subscription checkout
- `POST /api/subscriptions/portal` - Create customer portal session
- `POST /api/subscriptions/cancel` - Cancel subscription
- `PUT /api/subscriptions/update` - Update subscription
- `GET /api/subscriptions/history` - Get subscription history

### Token Endpoints

- `GET /api/tokens/balance` - Get token balance
- `GET /api/tokens/transactions` - Get token transactions
- `GET /api/tokens/packs` - Get available token packs
- `POST /api/tokens/purchase` - Purchase token pack
- `POST /api/tokens/use` - Use tokens
- `POST /api/tokens/add` - Add tokens (admin)
- `GET /api/tokens/social` - Get social engagement tasks
- `POST /api/tokens/social` - Submit social engagement
- `GET /api/tokens/analytics` - Get usage analytics

### Webhook Endpoints

- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/retry` - Retry failed webhooks
- `GET /api/webhooks/status` - Get webhook status

## Database Schema

The application uses the following main tables:

- `users` - User accounts and authentication
- `user_profiles` - Extended user profile information
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User subscription records
- `token_transactions` - Token transaction history
- `token_packs` - Available token packs
- `user_token_packs` - User token pack purchases
- `social_engagements` - Social media engagement records
- `usage_analytics` - Usage tracking and analytics
- `audit_logs` - Audit trail for all actions
- `webhook_events` - Webhook event processing

See `migrations/0001_initial_schema.sql` for complete schema.

## Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Audit Logging**: Complete audit trail
- **Webhook Security**: Signature verification for webhooks

## Environment Variables

See `.env.example` for all available environment variables and their descriptions.

## Scripts

- `npm run dev` - Start development server
- `npm run deploy` - Deploy to production
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:prod` - Deploy to production
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:local` - Run migrations locally
- `npm run db:seed` - Seed database with sample data
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## Monitoring and Logging

- Comprehensive error handling and logging
- Health check endpoint at `/health`
- Webhook status monitoring
- Audit logging for all user actions
- Performance metrics tracking

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all migrations are tested
5. Run linting and type checking before commits

## License

This project is part of AI Audio Studio Pro and is subject to the project's license terms.