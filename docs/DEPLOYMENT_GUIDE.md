# AI Audio Studio Pro - Hosting Deployment Guide

## Overview

This comprehensive guide provides step-by-step instructions for deploying AI Audio Studio Pro on your websites, including hustledigga.com and other domains. The platform supports multi-tenant architecture, allowing you to serve multiple sites from a single backend instance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Multi-Tenant Setup](#multi-tenant-setup)
6. [Domain Configuration](#domain-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Environment Configuration](#environment-configuration)
9. [Database Setup](#database-setup)
10. [Monitoring and Analytics](#monitoring-and-analytics)
11. [Security Configuration](#security-configuration)
12. [Performance Optimization](#performance-optimization)
13. [Backup and Recovery](#backup-and-recovery)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Technical Requirements

#### Server Requirements

- **Cloudflare Workers Account** (for backend)
- **Domain Name** (hustledigga.com or custom domain)
- **DNS Access** (for domain configuration)
- **SSL Certificate** (automatic with Cloudflare)
- **Payment Processor** (Stripe account)

#### Development Tools

- **Node.js 18+** (for local development)
- **Git** (for version control)
- **Cloudflare CLI** (wrangler)
- **Text Editor** (VS Code recommended)

#### Accounts and Services

1. **Cloudflare**
   - Workers subscription
   - D1 database
   - KV storage
   - Custom domain support

2. **Stripe**
   - Account setup
   - API keys
   - Webhook configuration
   - Product catalog

3. **Email Service** (Optional)
   - SendGrid, Mailgun, or similar
   - SMTP configuration
   - Template setup

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React SPA)   │◄──►│  (Cloudflare    │◄──►│  (Cloudflare    │
│                 │    │   Workers)      │    │   D1)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   KV Storage    │    │   File Storage  │
│   (Cloudflare)  │    │   (Sessions)    │    │   (R2/AWS S3)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tenant Support

The platform supports multiple sites from a single deployment:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Audio Studio Pro                      │
│                    (Single Backend)                         │
├─────────────────────────────────────────────────────────────┤
│  Site Management:                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ hustledigga │ │ site2.com   │ │ site3.com   │    ...    │
│  │   .com      │ │             │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Deployment

### Cloudflare Workers Setup

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Configure Environment**
   ```bash
   cd backend
   npm install
   wrangler d1 create ai-audio-studio-pro-db
   wrangler kv:namespace create SESSIONS
   wrangler kv:namespace create CACHE
   ```

3. **Update wrangler.toml**
   ```toml
   name = "ai-audio-studio-pro"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [[env.production.d1_databases]]
   binding = "DB"
   database_name = "ai-audio-studio-pro-db"
   database_id = "your-database-id"

   [[env.production.kv_namespaces]]
   binding = "SESSIONS"
   id = "your-sessions-kv-id"

   [[env.production.kv_namespaces]]
   binding = "CACHE"
   id = "your-cache-kv-id"

   [env.production.vars]
   JWT_SECRET = "your-jwt-secret"
   STRIPE_SECRET_KEY = "your-stripe-secret"
   STRIPE_WEBHOOK_SECRET = "your-webhook-secret"
   FRONTEND_URL = "https://hustledigga.com"
   API_URL = "https://api.hustledigga.com"
   ```

### Database Migration

1. **Run Initial Migration**
   ```bash
   wrangler d1 execute ai-audio-studio-pro-db --file=migrations/0001_initial_schema.sql
   wrangler d1 execute ai-audio-studio-pro-db --file=migrations/0002_referral_system.sql
   ```

2. **Seed Initial Data**
   ```bash
   wrangler d1 execute ai-audio-studio-pro-db --file=seed.sql
   ```

### Deploy Backend

1. **Build and Deploy**
   ```bash
   npm run build
   wrangler deploy --env production
   ```

2. **Verify Deployment**
   ```bash
   curl https://api.hustledigga.com/health
   ```

---

## Frontend Deployment

### Build Configuration

1. **Environment Setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Create Production Environment**
   ```env
   # .env.production
   VITE_API_URL=https://api.hustledigga.com
   VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
   VITE_APP_NAME=AI Audio Studio Pro
   VITE_SITE_DOMAIN=hustledigga.com
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Static Hosting Options

#### Option 1: Cloudflare Pages

1. **Connect Repository**
   - Go to Cloudflare Dashboard
   - Pages > Create a project
   - Connect your Git repository
   - Set build command: `npm run build`
   - Set output directory: `dist`

2. **Configure Custom Domain**
   ```
   Domain: hustledigga.com
   SSL: Automatic
   DNS: CNAME to pages.cloudflare.com
   ```

#### Option 2: Vercel

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Configure Domain**
   ```
   vercel domains add hustledigga.com
   ```

#### Option 3: Netlify

1. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

---

## Multi-Tenant Setup

### Site Configuration

1. **Create Site in Database**
   ```sql
   INSERT INTO sites (
     id, owner_id, domain, name, description, status, created_at, updated_at
   ) VALUES (
     'site-hustledigga-1',
     'admin-super-1',
     'hustledigga.com',
     'HustleDigga',
     'AI Audio Studio Pro Platform',
     'active',
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
   );
   ```

2. **Configure Site Settings**
   ```json
   {
     "theme": {
       "primaryColor": "#3B82F6",
       "secondaryColor": "#10B981",
       "accentColor": "#8B5CF6"
     },
     "branding": {
       "logo": "/assets/logo.png",
       "favicon": "/assets/favicon.ico",
       "siteName": "AI Audio Studio Pro"
     },
     "features": {
       "voiceCloning": true,
       "stemSeparation": true,
       "videoGeneration": true
     }
   }
   ```

### Multi-Site Routing

1. **Domain Detection Middleware**
   ```typescript
   // Add to backend/src/middleware/site.ts
   export function siteDetection() {
     return async (c: Context, next: Next) => {
       const hostname = c.req.header('host');
       const site = await c.get('db').executeOne(
         'SELECT * FROM sites WHERE domain = ? OR custom_domain = ? AND status = "active"',
         [hostname, hostname]
       );
       
       if (site) {
         c.set('site', site);
       }
       
       await next();
     };
   }
   ```

2. **Site-Specific Configuration**
   ```typescript
   // Add to main app
   app.use('*', siteDetection());
   ```

---

## Domain Configuration

### DNS Setup

#### Cloudflare DNS Configuration

1. **Root Domain (hustledigga.com)**
   ```
   Type: A
   Name: @
   Content: 192.0.2.1 (Cloudflare IP)
   Proxy: Enabled
   TTL: Auto
   ```

2. **API Subdomain (api.hustledigga.com)**
   ```
   Type: CNAME
   Name: api
   Content: ai-audio-studio-pro.your-subdomain.workers.dev
   Proxy: Enabled
   TTL: Auto
   ```

3. **WWW Subdomain (www.hustledigga.com)**
   ```
   Type: CNAME
   Name: www
   Content: hustledigga.com
   Proxy: Enabled
   TTL: Auto
   ```

### Custom Domain for Workers

1. **Configure Workers Route**
   ```bash
   wrangler routes list
   wrangler routes add api.hustledigga.com/* ai-audio-studio-pro
   ```

2. **Update wrangler.toml**
   ```toml
   [env.production]
   routes = [
     { pattern = "api.hustledigga.com/*", zone_name = "hustledigga.com" }
   ]
   ```

---

## SSL/TLS Setup

### Automatic SSL with Cloudflare

1. **SSL/TLS Encryption Mode**
   ```
   Setting: Full (strict)
   Encrypts: End-to-end
   HSTS: Enabled
   Minimum TLS Version: 1.2
   ```

2. **Certificate Management**
   - Automatic certificate renewal
   - Wildcard certificate support
   - Edge certificate optimization
   - Origin certificate creation

### Additional Security Headers

1. **Security Headers Configuration**
   ```typescript
   // Add to backend/src/middleware/security.ts
   app.use('*', async (c, next) => {
     c.header('X-Frame-Options', 'DENY');
     c.header('X-Content-Type-Options', 'nosniff');
     c.header('X-XSS-Protection', '1; mode=block');
     c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
     c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
     await next();
   });
   ```

---

## Environment Configuration

### Production Environment Variables

#### Backend Environment

```bash
# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRATION=7d

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database
DATABASE_URL=cloudflare-d1://your-database-id

# KV Storage
SESSIONS_KV_NAMESPACE=your-sessions-namespace
CACHE_KV_NAMESPACE=your-cache-namespace

# Application URLs
FRONTEND_URL=https://hustledigga.com
API_URL=https://api.hustledigga.com

# Email Service (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@hustledigga.com

# External Services
LALAL_AI_API_KEY=your-lalal-api-key
VIDEO_GENERATION_API_KEY=your-video-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

#### Frontend Environment

```bash
# API Configuration
VITE_API_URL=https://api.hustledigga.com
VITE_WS_URL=wss://api.hustledigga.com

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key

# Application
VITE_APP_NAME=AI Audio Studio Pro
VITE_SITE_DOMAIN=hustledigga.com
VITE_VERSION=1.0.0

# Analytics (Optional)
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
VITE_HOTJAR_ID=your-hotjar-id

# Feature Flags
VITE_ENABLE_VIDEO_GENERATION=true
VITE_ENABLE_VOICE_CLONING=true
VITE_ENABLE_STEM_SEPARATION=true
```

---

## Database Setup

### D1 Database Configuration

1. **Database Creation**
   ```bash
   wrangler d1 create ai-audio-studio-pro-db
   ```

2. **Migration Management**
   ```bash
   # Create new migration
   wrangler d1 migrations create add_new_feature

   # Run migrations
   wrangler d1 migrations apply ai-audio-studio-pro-db --remote
   ```

3. **Database Backup**
   ```bash
   # Export data
   wrangler d1 export ai-audio-studio-pro-db --output=backup.sql

   # Import data
   wrangler d1 execute ai-audio-studio-pro-db --file=backup.sql
   ```

### Performance Optimization

1. **Index Creation**
   ```sql
   -- User-related indexes
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_created_at ON users(created_at);

   -- Subscription indexes
   CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
   CREATE INDEX idx_subscriptions_status ON subscriptions(status);

   -- Token indexes
   CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
   CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at);

   -- Referral indexes
   CREATE INDEX idx_referral_codes_code ON referral_codes(referral_code);
   CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
   ```

2. **Query Optimization**
   - Use prepared statements
   - Implement pagination
   - Cache frequent queries
   - Monitor query performance

---

## Monitoring and Analytics

### Application Monitoring

1. **Cloudflare Analytics**
   - Request metrics
   - Error rates
   - Response times
   - Geographic distribution

2. **Custom Monitoring**
   ```typescript
   // Add to backend/src/middleware/monitoring.ts
   export function monitoring() {
     return async (c: Context, next: Next) => {
       const start = Date.now();
       
       await next();
       
       const duration = Date.now() - start;
       console.log({
         method: c.req.method,
         path: c.req.path,
         status: c.res.status,
         duration,
         userAgent: c.req.header('user-agent'),
         ip: c.req.header('cf-connecting-ip')
       });
     };
   }
   ```

### Error Tracking

1. **Sentry Integration**
   ```typescript
   import * as Sentry from '@sentry/cloudflare';

   Sentry.init({
     dsn: c.env.SENTRY_DSN,
     environment: 'production'
   });
   ```

2. **Error Logging**
   ```typescript
   app.onError((err, c) => {
     console.error('Application error:', err);
     
     if (c.env.SENTRY_DSN) {
       Sentry.captureException(err);
     }
     
     return c.json({ error: 'Internal server error' }, 500);
   });
   ```

### Performance Metrics

1. **Key Performance Indicators**
   - Response time (p50, p95, p99)
   - Error rate percentage
   - Request volume
   - Database query performance
   - Worker CPU usage

2. **Health Checks**
   ```typescript
   app.get('/health', async (c) => {
     const health = {
       status: 'ok',
       timestamp: new Date().toISOString(),
       services: {
         database: await checkDatabase(c),
         kv: await checkKV(c),
         stripe: await checkStripe(c)
       }
     };
     
     return c.json(health);
   });
   ```

---

## Security Configuration

### Authentication Security

1. **JWT Configuration**
   ```typescript
   // Strong JWT secret
   const JWT_SECRET = crypto.getRandomValues(new Uint8Array(64)).join('');
   
   // Token configuration
   const tokenConfig = {
     expiresIn: '7d',
     issuer: 'ai-audio-studio-pro',
     audience: 'ai-audio-studio-pro-users'
   };
   ```

2. **Password Security**
   ```typescript
   // bcrypt configuration
   const saltRounds = 12;
   const hashPassword = async (password: string) => {
     return await bcrypt.hash(password, saltRounds);
   };
   ```

### API Security

1. **Rate Limiting**
   ```typescript
   // Rate limiting by IP and user
   const rateLimit = new Map<string, { count: number; resetTime: number }>();

   export function rateLimiter(maxRequests = 100, windowMs = 60000) {
     return async (c: Context, next: Next) => {
       const ip = c.req.header('cf-connecting-ip');
       const key = `rate_limit:${ip}`;
       const now = Date.now();
       
       const limit = rateLimit.get(key);
       
       if (!limit || now > limit.resetTime) {
         rateLimit.set(key, { count: 1, resetTime: now + windowMs });
       } else if (limit.count >= maxRequests) {
         return c.json({ error: 'Too many requests' }, 429);
       } else {
         limit.count++;
       }
       
       await next();
     };
   }
   ```

2. **Input Validation**
   ```typescript
   // Zod schema validation
   const userSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     firstName: z.string().optional(),
     lastName: z.string().optional()
   });

   export function validateBody(schema: z.ZodSchema) {
     return async (c: Context, next: Next) => {
       try {
         const body = await c.req.json();
         const validated = schema.parse(body);
         c.set('validatedBody', validated);
         await next();
       } catch (error) {
         return c.json({ error: 'Invalid input' }, 400);
       }
     };
   }
   ```

### Data Protection

1. **Encryption at Rest**
   - Cloudflare D1 automatically encrypts data
   - KV storage encryption
   - Secure file storage

2. **Data Privacy**
   ```typescript
   // Remove sensitive data from logs
   const sanitizeLogData = (data: any) => {
     const { password, token, ...sanitized } = data;
     return sanitized;
   };
   ```

---

## Performance Optimization

### Caching Strategy

1. **KV Storage Caching**
   ```typescript
   export function cache(ttl = 3600) {
     return async (c: Context, next: Next) => {
       const key = `cache:${c.req.method}:${c.req.path}`;
       const cached = await c.env.CACHE.get(key);
       
       if (cached) {
         return c.json(JSON.parse(cached));
       }
       
       await next();
       
       const response = c.res;
       if (response.status === 200) {
         await c.env.CACHE.put(key, JSON.stringify(response.body), {
           expirationTtl: ttl
         });
       }
     };
   }
   ```

2. **Browser Caching**
   ```typescript
   app.get('/assets/*', async (c) => {
     const asset = await getAsset(c.req.path);
     
     if (asset) {
       c.header('Cache-Control', 'public, max-age=31536000');
       c.header('ETag', asset.etag);
       return c.body(asset.data, 200);
     }
     
     return c.notFound();
   });
   ```

### Frontend Optimization

1. **Bundle Optimization**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             ui: ['lucide-react'],
             audio: ['tone']
           }
         }
       },
       minify: 'terser',
       sourcemap: false
     }
   });
   ```

2. **Asset Optimization**
   - Image compression
   - Font optimization
   - CSS minification
   - JavaScript tree shaking

---

## Backup and Recovery

### Database Backups

1. **Automated Backups**
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   wrangler d1 export ai-audio-studio-pro-db --output="backup_${DATE}.sql"
   
   # Upload to cloud storage
   aws s3 cp "backup_${DATE}.sql" s3://your-backup-bucket/
   ```

2. **Backup Schedule**
   - Daily automatic backups
   - Weekly full backups
   - Monthly archival
   - Retention policy: 90 days

### Disaster Recovery

1. **Recovery Procedures**
   ```bash
   # Restore from backup
   wrangler d1 execute ai-audio-studio-pro-db --file=backup_20240101_120000.sql
   
   # Verify data integrity
   wrangler d1 execute ai-audio-studio-pro-db --command="SELECT COUNT(*) FROM users"
   ```

2. **High Availability**
   - Multi-region deployment
   - Database replicas
   - Load balancing
   - Failover procedures

---

## Troubleshooting

### Common Deployment Issues

#### Backend Issues

1. **Worker Deployment Failures**
   ```
   Problem: Deployment fails with syntax errors
   Solution: 
   - Check TypeScript compilation
   - Verify wrangler.toml configuration
   - Review environment variables
   - Check for missing dependencies
   ```

2. **Database Connection Issues**
   ```
   Problem: Cannot connect to D1 database
   Solution:
   - Verify database ID in wrangler.toml
   - Check database permissions
   - Run database migrations
   - Test with wrangler d1 execute
   ```

#### Frontend Issues

1. **Build Failures**
   ```
   Problem: npm run build fails
   Solution:
   - Check environment variables
   - Verify dependencies
   - Clear node_modules and reinstall
   - Check TypeScript errors
   ```

2. **API Connection Issues**
   ```
   Problem: Frontend cannot connect to backend
   Solution:
   - Verify API URL configuration
   - Check CORS settings
   - Test API endpoints directly
   - Review network tab in browser
   ```

### Performance Issues

1. **Slow Response Times**
   ```
   Solutions:
   - Implement caching
   - Optimize database queries
   - Enable Cloudflare caching
   - Monitor worker CPU usage
   - Review bundle size
   ```

2. **High Error Rates**
   ```
   Solutions:
   - Check error logs
   - Monitor worker limits
   - Review rate limiting
   - Implement retry logic
   - Add better error handling
   ```

### Monitoring Issues

1. **Missing Metrics**
   ```
   Solutions:
   - Verify monitoring setup
   - Check log levels
   - Test health endpoints
   - Review analytics configuration
   ```

2. **Alert Fatigue**
   ```
   Solutions:
   - Adjust alert thresholds
   - Implement alert grouping
   - Add severity levels
   - Create on-call schedules
   ```

---

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Update dependencies
   - Monitor storage usage

2. **Monthly**
   - Security updates
   - Backup verification
   - Performance optimization
   - User analytics review

3. **Quarterly**
   - Security audit
   - Capacity planning
   - Feature roadmap review
   - Cost optimization

### Update Procedures

1. **Backend Updates**
   ```bash
   # Update dependencies
   npm update
   
   # Run tests
   npm test
   
   # Deploy staging
   wrangler deploy --env staging
   
   # Test staging
   # ... manual testing ...
   
   # Deploy production
   wrangler deploy --env production
   ```

2. **Frontend Updates**
   ```bash
   # Update dependencies
   npm update
   
   # Run tests
   npm test
   
   # Build production
   npm run build
   
   # Deploy to staging
   vercel --prod
   
   # Test staging
   # ... manual testing ...
   
   # Deploy to production
   # CI/CD pipeline handles this
   ```

---

## Support and Resources

### Documentation

- **API Documentation**: `/docs/API.md`
- **Admin Guide**: `/docs/ADMIN_GUIDE.md`
- **User Guide**: `/docs/USER_GUIDE.md`

### Community Support

- **GitHub Issues**: Report bugs and feature requests
- **Discord Community**: Real-time support and discussion
- **Stack Overflow**: Technical questions

### Professional Support

- **Email**: support@hustledigga.com
- **Priority Support**: Available for enterprise customers
- **Emergency Support**: 24/7 for critical issues

---

## Conclusion

This deployment guide provides comprehensive instructions for successfully deploying AI Audio Studio Pro across multiple domains. By following these steps, you'll have a robust, scalable, and secure platform ready to serve users.

Key takeaways:

1. **Use Cloudflare Workers** for serverless backend deployment
2. **Implement multi-tenant architecture** for multiple site support
3. **Configure proper security** including SSL/TLS and authentication
4. **Set up monitoring** to track performance and issues
5. **Regular maintenance** ensures optimal performance

For additional assistance or custom deployment requirements, contact our support team.

---

*Last Updated: January 2024*
*Version: 1.0.0*