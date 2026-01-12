# AI Audio Studio Pro - Complete Platform Solution

A comprehensive, multi-tenant audio processing platform built with React, TypeScript, and Cloudflare Workers. Features voice cloning, AI stem separation, voice cleaning, video generation, and a complete referral system.

## 🚀 Quick Start

### For Administrators

1. **Access Admin Dashboard**
   ```
   URL: https://hustledigga.com/admin
   Email: drosaumega@gmail.com
   ```

2. **Initial Setup**
   - Review admin dashboard overview
   - Create referral codes for users
   - Configure multi-tenant sites
   - Monitor system health

### For Users

1. **Registration**
   ```
   URL: https://hustledigga.com
   - Click "Sign Up"
   - Enter email and password
   - Verify email address
   - Apply referral code (if available)
   ```

2. **Getting Started**
   - Explore the dashboard
   - Check token balance
   - Try voice cloning or stem separation
   - Join referral program

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS with dark mode
- **State Management**: React hooks and context
- **Icons**: Lucide React + HugeIcons

### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV for sessions/cache
- **API**: Hono framework with TypeScript
- **Payments**: Stripe integration

### Multi-Tenant Support
- **Site Management**: Multiple domains from single backend
- **Configuration**: Per-site theming and feature toggles
- **User Management**: Site-specific user roles
- **Analytics**: Per-site usage tracking

## 📋 Features

### Core Audio Processing
- **Voice Cloning**: AI-powered voice synthesis
- **Stem Separation**: Isolate vocals, drums, bass, etc.
- **Voice Cleaning**: Noise removal and enhancement
- **Voice Changing**: Real-time voice transformation
- **Video Generation**: AI music video creation

### User Management
- **Authentication**: JWT-based secure login
- **Profiles**: User settings and preferences
- **Subscriptions**: Tiered pricing plans
- **Token System**: Usage-based credits
- **Referral Program**: User referral rewards

### Administrative Features
- **Dashboard**: Complete admin overview
- **User Management**: View and manage users
- **Site Management**: Multi-tenant configuration
- **Analytics**: Revenue and usage metrics
- **Health Monitoring**: System status tracking

## 🛠️ Installation & Deployment

### Prerequisites
- Node.js 18+
- Cloudflare account
- Stripe account
- Domain name

### Frontend Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your settings
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy to Hosting**
   ```bash
   # Option 1: Vercel
   npm install -g vercel
   vercel --prod
   
   # Option 2: Netlify
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   
   # Option 3: Cloudflare Pages
   # Connect repository in Cloudflare dashboard
   ```

### Backend Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Database**
   ```bash
   wrangler d1 create ai-audio-studio-pro-db
   wrangler kv:namespace create SESSIONS
   wrangler kv:namespace create CACHE
   ```

4. **Update Configuration**
   ```bash
   # Edit wrangler.toml with your database IDs
   # Set environment variables
   ```

5. **Run Migrations**
   ```bash
   wrangler d1 migrations apply ai-audio-studio-pro-db --remote
   ```

6. **Deploy Backend**
   ```bash
   wrangler deploy --env production
   ```

## 📁 Project Structure

```
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── ReferralSystem.tsx    # Referral management
│   │   ├── AdminDashboard.tsx    # Admin interface
│   │   ├── ReferralApplication.tsx # User referral flow
│   │   └── SiteManager.tsx       # Multi-tenant management
│   ├── pages/                    # Page components
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript definitions
├── backend/                      # Backend source
│   ├── src/
│   │   ├── handlers/             # API route handlers
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── referrals.ts     # Referral system
│   │   │   ├── admin.ts         # Admin functions
│   │   │   └── subscriptions.ts  # Payment handling
│   │   ├── lib/                  # Core services
│   │   ├── middleware/           # Request middleware
│   │   └── index.ts              # Main application
│   ├── migrations/              # Database migrations
│   └── docs/                    # API documentation
├── docs/                        # Documentation
│   ├── ADMIN_GUIDE.md          # Administrator guide
│   ├── USER_GUIDE.md           # User documentation
│   └── DEPLOYMENT_GUIDE.md     # Deployment instructions
└── public/                      # Static assets
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.production)
```bash
VITE_API_URL=https://api.hustledigga.com
VITE_STRIPE_PUBLIC_KEY=pk_live_your_key
VITE_APP_NAME=AI Audio Studio Pro
VITE_SITE_DOMAIN=hustledigga.com
```

#### Backend (wrangler.toml)
```toml
[env.production.vars]
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://hustledigga.com
API_URL=https://api.hustledigga.com
```

### Database Schema

The platform uses the following main tables:
- `users` - User accounts and profiles
- `subscriptions` - User subscription plans
- `referral_codes` - Referral program codes
- `referrals` - Referral relationships
- `admin_accounts` - Administrator accounts
- `sites` - Multi-tenant site configuration

## 🎯 Usage Examples

### Creating Referral Codes (Admin)
```typescript
const response = await fetch('/api/referrals/codes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    maxUses: 100,
    rewardTokens: 50,
    referrerRewardTokens: 100
  })
});
```

### Applying Referral Codes (User)
```typescript
const response = await fetch('/api/referrals/apply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    referralCode: 'AUDIO123ABC',
    referralPin: 'ABCD1234'
  })
});
```

### Multi-Site Configuration
```typescript
const siteConfig = {
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981'
  },
  features: {
    voiceCloning: true,
    stemSeparation: true,
    videoGeneration: true
  }
};
```

## 📊 Analytics & Monitoring

### Key Metrics
- User registration and retention
- Subscription conversion rates
- Token usage patterns
- Referral program performance
- Revenue tracking

### Health Monitoring
- API response times
- Database performance
- Error rate tracking
- System resource usage

## 🔒 Security Features

- **Authentication**: JWT with secure secret management
- **Authorization**: Role-based access control
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation
- **HTTPS**: SSL/TLS encryption everywhere
- **CORS**: Proper cross-origin configuration

## 💳 Payment Integration

### Stripe Configuration
- Subscription management
- One-time token purchases
- Webhook processing
- Customer portal access
- Automated billing

### Pricing Tiers
- **Free**: 50 tokens, basic features
- **Basic**: 500 tokens, advanced features ($19.99/month)
- **Premium**: 2000 tokens, all features ($49.99/month)

## 🤝 Referral Program

### How It Works
1. Admin creates referral codes with custom rewards
2. Users share codes with friends
3. New users apply codes during registration
4. Both parties receive token rewards
5. Admin tracks program performance

### Reward Structure
- **Default**: 50 tokens to new user, 100 to referrer
- **Customizable**: Per-code configuration
- **Tier Bonuses**: Extra rewards for premium referrals

## 🌐 Multi-Tenant Architecture

### Site Management
- Multiple domains from single backend
- Per-site theming and branding
- Feature toggles per site
- Independent user management
- Site-specific analytics

### Deployment Options
- Single backend instance
- Multiple frontend deployments
- Custom domain support
- SSL certificate management
- CDN integration

## 🧪 Testing

### Frontend Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Backend Tests
```bash
cd backend
npm run test              # Run API tests
npm run test:watch        # Watch mode
```

## 📈 Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies
- Service worker implementation

### Backend
- Database query optimization
- Response caching
- CDN integration
- Worker performance tuning
- Resource monitoring

## 🚀 Scaling Considerations

### Horizontal Scaling
- Cloudflare Workers auto-scaling
- Database connection pooling
- Load balancing
- Geographic distribution

### Vertical Scaling
- Resource monitoring
- Performance optimization
- Capacity planning
- Cost optimization

## 🛠️ Development Workflow

### Git Workflow
```bash
git clone <repository>
cd ai-audio-studio-pro
npm install
npm run dev              # Start development server
```

### Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Pre-commit hooks
- Automated testing

## 📚 Documentation

- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Complete administrator documentation
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Technical deployment instructions
- **[API Documentation](backend/docs/API.md)** - REST API reference

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Technical Support
- **Email**: support@hustledigga.com
- **Documentation**: https://docs.hustledigga.com
- **Status Page**: https://status.hustledigga.com

### Community
- **Discord**: [Join our Discord](https://discord.gg/your-invite)
- **GitHub Issues**: Report bugs and feature requests
- **Twitter**: @AIAudioStudioPro

## 🔄 Version History

### v1.0.0 (January 2024)
- Initial release
- Complete audio processing suite
- Multi-tenant architecture
- Referral system
- Admin dashboard
- Stripe integration

## 🎯 Roadmap

### Upcoming Features
- Mobile app development
- Advanced AI models
- Real-time collaboration
- Enhanced analytics
- API v2
- Plugin system

### Infrastructure Improvements
- Edge computing optimization
- Advanced caching
- Global CDN expansion
- Performance monitoring
- Automated scaling

---

**AI Audio Studio Pro** - Professional audio processing made simple.

Built with ❤️ using React, TypeScript, and Cloudflare Workers.