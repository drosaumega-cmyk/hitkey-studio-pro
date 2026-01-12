/**
 * AI Audio Studio Pro Backend API
 * Main application entry point
 */
import 'dotenv/config';
import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { generalRateLimit, authRateLimit, paymentRateLimit } from './middleware/rateLimit';
import { authMiddleware, optionalAuthMiddleware, requireTier } from './middleware/auth';
import { validateBody, schemas } from './middleware/validation';
import { WebSocketManager } from './WebSocketManager';
import { DatabaseService, CacheService, SessionService } from './lib/database';
import { AuthHandler } from './handlers/auth';
import { SubscriptionHandler } from './handlers/subscriptions';
import { TokenHandler } from './handlers/tokens';
import { WebhookHandler } from './handlers/webhooks';
import { ReferralHandler } from './handlers/referrals';
import { AdminHandler } from './handlers/admin';
const app = new Hono();
// Initialize services
app.use('*', async (c, next) => {
    const db = new DatabaseService(c.env.DB);
    const cache = new CacheService(c.env.CACHE);
    const session = new SessionService(c.env.SESSIONS);
    c.set('db', db);
    c.set('cache', cache);
    c.set('session', session);
    await next();
});
// Global middleware
app.use('*', corsMiddleware);
app.use('*', generalRateLimit);
// Health check
app.get('/health', async (c) => {
    const db = c.get('db');
    const health = await db.healthCheck();
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: health,
    });
});
// API routes
const api = new Hono();
// Initialize handlers
api.use('*', async (c, next) => {
    const db = c.get('db');
    const session = c.get('session');
    c.set('authHandler', new AuthHandler(db, session));
    c.set('subscriptionHandler', new SubscriptionHandler(db));
    c.set('tokenHandler', new TokenHandler(db));
    c.set('webhookHandler', new WebhookHandler(db));
    c.set('referralHandler', new ReferralHandler(db));
    c.set('adminHandler', new AdminHandler(db));
    await next();
});
// Authentication routes
const auth = new Hono();
auth.post('/register', authRateLimit, validateBody(schemas.register), async (c) => {
    const handler = c.get('authHandler');
    return await handler.register(c);
});
auth.post('/login', authRateLimit, validateBody(schemas.login), async (c) => {
    const handler = c.get('authHandler');
    return await handler.login(c);
});
auth.post('/logout', authMiddleware, async (c) => {
    const handler = c.get('authHandler');
    return await handler.logout(c);
});
auth.get('/profile', authMiddleware, async (c) => {
    const handler = c.get('authHandler');
    return await handler.getProfile(c);
});
auth.put('/profile', authMiddleware, validateBody(schemas.updateProfile), async (c) => {
    const handler = c.get('authHandler');
    return await handler.updateProfile(c);
});
auth.post('/change-password', authMiddleware, validateBody(schemas.changePassword), async (c) => {
    const handler = c.get('authHandler');
    return await handler.changePassword(c);
});
auth.post('/request-password-reset', authRateLimit, async (c) => {
    const handler = c.get('authHandler');
    return await handler.requestPasswordReset(c);
});
auth.post('/reset-password', authRateLimit, async (c) => {
    const handler = c.get('authHandler');
    return await handler.resetPassword(c);
});
auth.post('/verify-email', async (c) => {
    const handler = c.get('authHandler');
    return await handler.verifyEmail(c);
});
// Subscription routes
const subscriptions = new Hono();
subscriptions.get('/plans', optionalAuthMiddleware, async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.getPlans(c);
});
subscriptions.get('/current', authMiddleware, async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.getCurrentSubscription(c);
});
subscriptions.post('/checkout', authMiddleware, paymentRateLimit, validateBody(schemas.createSubscriptionCheckout), async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.createSubscriptionCheckout(c);
});
subscriptions.post('/portal', authMiddleware, paymentRateLimit, async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.createPortalSession(c);
});
subscriptions.post('/cancel', authMiddleware, validateBody(schemas.cancelSubscription), async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.cancelSubscription(c);
});
subscriptions.put('/update', authMiddleware, validateBody(schemas.updateSubscription), async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.updateSubscription(c);
});
subscriptions.get('/history', authMiddleware, async (c) => {
    const handler = c.get('subscriptionHandler');
    return await handler.getSubscriptionHistory(c);
});
// Token routes
const tokens = new Hono();
tokens.get('/balance', authMiddleware, async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.getTokenBalance(c);
});
tokens.get('/transactions', authMiddleware, async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.getTokenTransactions(c);
});
tokens.get('/packs', optionalAuthMiddleware, async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.getTokenPacks(c);
});
tokens.post('/purchase', authMiddleware, paymentRateLimit, validateBody(schemas.purchaseTokenPack), async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.purchaseTokenPack(c);
});
tokens.post('/use', authMiddleware, validateBody(schemas.tokenUsage), async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.processTokenUsage(c);
});
tokens.post('/add', authMiddleware, validateBody(schemas.addTokens), async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.addTokens(c);
});
tokens.get('/social', authMiddleware, async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.getSocialEngagements(c);
});
tokens.post('/social', authMiddleware, validateBody(schemas.socialEngagement), async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.submitSocialEngagement(c);
});
tokens.get('/analytics', authMiddleware, async (c) => {
    const handler = c.get('tokenHandler');
    return await handler.getUsageAnalytics(c);
});
// Webhook routes
const webhooks = new Hono();
webhooks.post('/stripe', async (c) => {
    const handler = c.get('webhookHandler');
    return await handler.handleStripeWebhook(c);
});
webhooks.post('/retry', async (c) => {
    const handler = c.get('webhookHandler');
    return await handler.retryFailedWebhooks(c);
});
webhooks.get('/status', async (c) => {
    const handler = c.get('webhookHandler');
    return await handler.getWebhookStatus(c);
});
// Premium-only routes (examples)
const premium = new Hono();
premium.use('*', authMiddleware, requireTier('premium'));
premium.get('/features', async (c) => {
    return c.json({
        features: [
            'Unlimited voice cloning',
            'Studio-quality stem separation',
            'Professional audio restoration',
            'Advanced voice effects',
            '4K video generation',
            'Priority support',
            'API access',
            'Batch processing',
            'Advanced analytics',
        ],
    });
});
// Referral routes
const referrals = new Hono();
referrals.post('/codes', authMiddleware, paymentRateLimit, validateBody(schemas.createReferralCode), async (c) => {
    const handler = c.get('referralHandler');
    return await handler.createReferralCode(c);
});
referrals.get('/codes', authMiddleware, async (c) => {
    const handler = c.get('referralHandler');
    return await handler.getReferralCodes(c);
});
referrals.post('/validate', generalRateLimit, validateBody(schemas.validateReferralCode), async (c) => {
    const handler = c.get('referralHandler');
    return await handler.validateReferralCode(c);
});
referrals.post('/apply', authMiddleware, validateBody(schemas.applyReferralCode), async (c) => {
    const handler = c.get('referralHandler');
    return await handler.applyReferralCode(c);
});
referrals.get('/stats', authMiddleware, async (c) => {
    const handler = c.get('referralHandler');
    return await handler.getReferralStats(c);
});
referrals.get('/admin/all', authMiddleware, async (c) => {
    const handler = c.get('referralHandler');
    return await handler.getAllReferrals(c);
});
// Admin routes
const admin = new Hono();
admin.get('/dashboard', authMiddleware, async (c) => {
    const handler = c.get('adminHandler');
    return await handler.getDashboard(c);
});
admin.get('/users', authMiddleware, async (c) => {
    const handler = c.get('adminHandler');
    return await handler.getUsers(c);
});
admin.post('/admins', authMiddleware, validateBody(schemas.createAdmin), async (c) => {
    const handler = c.get('adminHandler');
    return await handler.createAdmin(c);
});
admin.get('/admins', authMiddleware, async (c) => {
    const handler = c.get('adminHandler');
    return await handler.getAdmins(c);
});
admin.post('/sites', authMiddleware, validateBody(schemas.createSite), async (c) => {
    const handler = c.get('adminHandler');
    return await handler.createSite(c);
});
admin.get('/sites', authMiddleware, async (c) => {
    const handler = c.get('adminHandler');
    return await handler.getSites(c);
});
admin.get('/health', authMiddleware, async (c) => {
    const handler = c.get('adminHandler');
    return await handler.getHealth(c);
});
// Mount routes
api.route('/auth', auth);
api.route('/subscriptions', subscriptions);
api.route('/tokens', tokens);
api.route('/webhooks', webhooks);
api.route('/referrals', referrals);
api.route('/admin', admin);
api.route('/premium', premium);
app.route('/api', api);
const webhookHandler = new WebhookHandler(db);
app.post("/api/webhook", (c) => webhookHandler.handle(c));
// 404 handler
app.notFound((c) => {
    return c.json({
        error: 'Not Found',
        message: 'The requested resource was not found',
    }, 404);
});
// Error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    }, 500);
});
export default {
    fetch: app.fetch,
};
export { WebSocketManager };
