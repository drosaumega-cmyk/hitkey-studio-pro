/**
 * Subscription management API handlers
 */
import { PaymentService } from '../lib/payments';
import { AuthService } from '../lib/auth';
export class SubscriptionHandler {
    db;
    paymentService;
    authService;
    constructor(db) {
        this.db = db;
        this.paymentService = new PaymentService(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key');
        this.authService = new AuthService(process.env.JWT_SECRET || 'your-secret-key');
    }
    /**
     * Get all available subscription plans
     */
    async getPlans(c) {
        try {
            const plans = await this.db.execute(`SELECT * FROM subscription_plans 
         WHERE is_active = TRUE 
         ORDER BY tier, price`);
            return c.json({ plans });
        }
        catch (error) {
            console.error('Get plans error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Get current user's subscription
     */
    async getCurrentSubscription(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const subscription = await this.db.executeOne(`SELECT us.*, sp.name as plan_name, sp.tier, sp.billing_cycle, sp.price, sp.currency, 
                sp.tokens as plan_tokens, sp.features, sp.max_file_size, sp.max_concurrent_jobs,
                sp.priority_support, sp.api_access, sp.custom_models, sp.watermark
         FROM user_subscriptions us 
         JOIN subscription_plans sp ON us.plan_id = sp.id 
         WHERE us.user_id = ? AND us.status = 'active' 
         ORDER BY us.created_at DESC LIMIT 1`, [payload.userId]);
            if (!subscription) {
                // Return free plan as default
                const freePlan = await this.db.executeOne('SELECT * FROM subscription_plans WHERE tier = ? AND billing_cycle = ?', ['free', 'monthly']);
                return c.json({
                    subscription: freePlan ? {
                        ...freePlan,
                        status: 'active',
                        tokens_allocated: freePlan.tokens,
                        tokens_used: 0,
                    } : null,
                });
            }
            return c.json({ subscription });
        }
        catch (error) {
            console.error('Get current subscription error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Create a subscription checkout session
     */
    async createSubscriptionCheckout(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const { planId, trialPeriodDays } = await c.req.json();
            if (!planId) {
                return c.json({ error: 'Plan ID is required' }, 400);
            }
            // Get plan details
            const plan = await this.db.executeOne('SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE', [planId]);
            if (!plan) {
                return c.json({ error: 'Plan not found' }, 404);
            }
            // Get user details
            const user = await this.db.executeOne('SELECT id, email, stripe_customer_id FROM users WHERE id = ?', [payload.userId]);
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }
            // Create or get Stripe customer
            let customerId = user.stripe_customer_id;
            if (!customerId) {
                const customer = await this.paymentService.createCustomer(user.email, `${user.first_name} ${user.last_name}`.trim() || undefined, { userId: user.id });
                customerId = customer.id;
                // Update user with customer ID
                await this.db.executeRun('UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [customerId, user.id]);
            }
            // Get or create Stripe price
            let stripePriceId = plan.stripe_price_id;
            if (!stripePriceId) {
                // Create product if not exists
                const product = await this.paymentService.createProduct(plan.name, `${plan.tier} plan - ${plan.billing_cycle}`, { planId: plan.id, tier: plan.tier });
                // Create price
                const price = await this.paymentService.createPrice(product.id, plan.price, plan.currency.toLowerCase(), {
                    interval: plan.billing_cycle === 'monthly' ? 'month' :
                        plan.billing_cycle === 'quarterly' ? 'month' :
                            plan.billing_cycle === 'biyearly' ? 'month' : 'year',
                    intervalCount: plan.billing_cycle === 'quarterly' ? 3 :
                        plan.billing_cycle === 'biyearly' ? 6 : 1,
                }, { planId: plan.id, tier: plan.tier, billingCycle: plan.billing_cycle });
                stripePriceId = price.id;
                // Update plan with Stripe price ID
                await this.db.executeRun('UPDATE subscription_plans SET stripe_price_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [stripePriceId, plan.id]);
            }
            // Create checkout session
            const session = await this.paymentService.createSubscriptionCheckoutSession(stripePriceId, customerId, undefined, undefined, { userId: user.id, planId: plan.id }, trialPeriodDays);
            // Log audit event
            await this.db.executeRun(`INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'create_subscription_checkout', 'subscription', ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
                user.id,
                planId,
                JSON.stringify({ planId, trialPeriodDays, sessionId: session.sessionId }),
                c.req.header('cf-connecting-ip') || null,
                c.req.header('user-agent') || null
            ]);
            return c.json({
                sessionId: session.sessionId,
                url: session.url,
            });
        }
        catch (error) {
            console.error('Create subscription checkout error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Create a customer portal session
     */
    async createPortalSession(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const user = await this.db.executeOne('SELECT id, stripe_customer_id FROM users WHERE id = ?', [payload.userId]);
            if (!user || !user.stripe_customer_id) {
                return c.json({ error: 'No active subscription found' }, 404);
            }
            const session = await this.paymentService.createPortalSession(user.stripe_customer_id);
            return c.json({
                sessionId: session.sessionId,
                url: session.url,
            });
        }
        catch (error) {
            console.error('Create portal session error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Cancel subscription
     */
    async cancelSubscription(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const { immediate } = await c.req.json();
            const subscription = await this.db.executeOne('SELECT * FROM user_subscriptions WHERE user_id = ? AND status = \'active\' ORDER BY created_at DESC LIMIT 1', [payload.userId]);
            if (!subscription) {
                return c.json({ error: 'No active subscription found' }, 404);
            }
            if (!subscription.stripe_subscription_id) {
                return c.json({ error: 'Subscription not linked to payment provider' }, 400);
            }
            // Cancel in Stripe
            await this.paymentService.cancelSubscription(subscription.stripe_subscription_id, immediate || false);
            // Update database
            await this.db.executeRun(`UPDATE user_subscriptions 
         SET status = ?, cancelled_at = CURRENT_TIMESTAMP, auto_renew = FALSE, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`, [immediate ? 'cancelled' : 'active', subscription.id]);
            // Log audit event
            await this.db.executeRun(`INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'cancel_subscription', 'subscription', ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
                payload.userId,
                subscription.id,
                JSON.stringify({ status: subscription.status, auto_renew: subscription.auto_renew }),
                JSON.stringify({ status: immediate ? 'cancelled' : 'active', auto_renew: false }),
                c.req.header('cf-connecting-ip') || null,
                c.req.header('user-agent') || null
            ]);
            return c.json({ message: 'Subscription cancelled successfully' });
        }
        catch (error) {
            console.error('Cancel subscription error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Update subscription (change plan)
     */
    async updateSubscription(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const { newPlanId } = await c.req.json();
            if (!newPlanId) {
                return c.json({ error: 'New plan ID is required' }, 400);
            }
            const currentSubscription = await this.db.executeOne('SELECT * FROM user_subscriptions WHERE user_id = ? AND status = \'active\' ORDER BY created_at DESC LIMIT 1', [payload.userId]);
            if (!currentSubscription) {
                return c.json({ error: 'No active subscription found' }, 404);
            }
            const newPlan = await this.db.executeOne('SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE', [newPlanId]);
            if (!newPlan) {
                return c.json({ error: 'New plan not found' }, 404);
            }
            if (!currentSubscription.stripe_subscription_id) {
                return c.json({ error: 'Subscription not linked to payment provider' }, 400);
            }
            // Get or create Stripe price for new plan
            let stripePriceId = newPlan.stripe_price_id;
            if (!stripePriceId) {
                const product = await this.paymentService.createProduct(newPlan.name, `${newPlan.tier} plan - ${newPlan.billing_cycle}`, { planId: newPlan.id, tier: newPlan.tier });
                const price = await this.paymentService.createPrice(product.id, newPlan.price, newPlan.currency.toLowerCase(), {
                    interval: newPlan.billing_cycle === 'monthly' ? 'month' :
                        newPlan.billing_cycle === 'quarterly' ? 'month' :
                            newPlan.billing_cycle === 'biyearly' ? 'month' : 'year',
                    intervalCount: newPlan.billing_cycle === 'quarterly' ? 3 :
                        newPlan.billing_cycle === 'biyearly' ? 6 : 1,
                }, { planId: newPlan.id, tier: newPlan.tier, billingCycle: newPlan.billing_cycle });
                stripePriceId = price.id;
                await this.db.executeRun('UPDATE subscription_plans SET stripe_price_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [stripePriceId, newPlan.id]);
            }
            // Update in Stripe
            await this.paymentService.updateSubscription(currentSubscription.stripe_subscription_id, { priceId: stripePriceId });
            // Update database
            await this.db.executeRun(`UPDATE user_subscriptions 
         SET plan_id = ?, tokens_allocated = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`, [newPlanId, newPlan.tokens, currentSubscription.id]);
            // Log audit event
            await this.db.executeRun(`INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'update_subscription', 'subscription', ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
                payload.userId,
                currentSubscription.id,
                JSON.stringify({ planId: currentSubscription.plan_id }),
                JSON.stringify({ planId: newPlanId }),
                c.req.header('cf-connecting-ip') || null,
                c.req.header('user-agent') || null
            ]);
            return c.json({ message: 'Subscription updated successfully' });
        }
        catch (error) {
            console.error('Update subscription error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
    /**
     * Get subscription history
     */
    async getSubscriptionHistory(c) {
        try {
            const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
            if (!token) {
                return c.json({ error: 'No token provided' }, 401);
            }
            const payload = this.authService.verifyToken(token);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }
            const { page = 1, limit = 20 } = c.req.query();
            const result = await this.db.paginate(`SELECT us.*, sp.name as plan_name, sp.tier, sp.billing_cycle, sp.price, sp.currency
         FROM user_subscriptions us 
         JOIN subscription_plans sp ON us.plan_id = sp.id 
         WHERE us.user_id = ? 
         ORDER BY us.created_at DESC`, [payload.userId], parseInt(page), parseInt(limit));
            return c.json(result);
        }
        catch (error) {
            console.error('Get subscription history error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
}
