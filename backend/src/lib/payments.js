/**
 * Payment processing service using Stripe
 */
import Stripe from 'stripe';
export class PaymentService {
    stripe;
    constructor(secretKey) {
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2024-04-10',
            typescript: true,
        });
    }
    /**
     * Create a new customer
     */
    async createCustomer(email, name, metadata) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                ...(metadata && { metadata }),
            });
            return {
                id: customer.id,
                email: customer.email || '',
                name: customer.name || undefined,
                metadata: customer.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error creating customer:', error);
            throw new Error('Failed to create customer');
        }
    }
    /**
     * Get customer by ID
     */
    async getCustomer(customerId) {
        try {
            const customer = await this.stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                return null;
            }
            return {
                id: customer.id,
                email: customer.email || '',
                name: customer.name || undefined,
                metadata: customer.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error retrieving customer:', error);
            return null;
        }
    }
    /**
     * Update customer
     */
    async updateCustomer(customerId, updates) {
        try {
            const customer = await this.stripe.customers.update(customerId, updates);
            return {
                id: customer.id,
                email: customer.email || '',
                name: customer.name || undefined,
                metadata: customer.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error updating customer:', error);
            throw new Error('Failed to update customer');
        }
    }
    /**
     * Create a payment intent for one-time payments
     */
    async createPaymentIntent(amount, currency = 'usd', customerId, metadata) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency,
                customer: customerId,
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret || '',
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                metadata: paymentIntent.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error creating payment intent:', error);
            throw new Error('Failed to create payment intent');
        }
    }
    /**
     * Create a product
     */
    async createProduct(name, description, metadata) {
        try {
            const product = await this.stripe.products.create({
                name,
                description,
                metadata,
            });
            return {
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                metadata: product.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error creating product:', error);
            throw new Error('Failed to create product');
        }
    }
    /**
     * Create a price for a product
     */
    async createPrice(productId, unitAmount, currency = 'usd', recurring, metadata) {
        try {
            const priceData = {
                product: productId,
                unit_amount: Math.round(unitAmount * 100), // Convert to cents
                currency,
                metadata,
            };
            if (recurring) {
                priceData.recurring = {
                    interval: recurring.interval,
                    ...(recurring.intervalCount && { interval_count: recurring.intervalCount }),
                };
            }
            const price = await this.stripe.prices.create(priceData);
            return {
                id: price.id,
                productId: price.product,
                unitAmount: price.unit_amount || 0,
                currency: price.currency,
                recurring: price.recurring ? {
                    interval: price.recurring.interval,
                    ...(price.recurring.interval_count && { intervalCount: price.recurring.interval_count }),
                } : undefined,
                metadata: price.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error creating price:', error);
            throw new Error('Failed to create price');
        }
    }
    /**
     * Create a subscription
     */
    async createSubscription(customerId, priceId, metadata, trialPeriodDays) {
        try {
            const subscriptionData = {
                customer: customerId,
                items: [{ price: priceId }],
                metadata,
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                    payment_method_types: ['card'],
                },
                expand: ['latest_invoice.payment_intent'],
            };
            if (trialPeriodDays) {
                subscriptionData.trial_period_days = trialPeriodDays;
            }
            const subscription = await this.stripe.subscriptions.create(subscriptionData);
            return {
                id: subscription.id,
                customerId: subscription.customer,
                priceId: subscription.items.data[0]?.price.id || '',
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                metadata: subscription.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error creating subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }
    /**
     * Get subscription by ID
     */
    async getSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            return {
                id: subscription.id,
                customerId: subscription.customer,
                priceId: subscription.items.data[0]?.price.id || '',
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                metadata: subscription.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error retrieving subscription:', error);
            return null;
        }
    }
    /**
     * Update subscription
     */
    async updateSubscription(subscriptionId, updates) {
        try {
            const updateData = {};
            if (updates.priceId) {
                updateData.items = [{ price: updates.priceId }];
            }
            if (updates.cancelAtPeriodEnd !== undefined) {
                updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
            }
            if (updates.metadata) {
                updateData.metadata = updates.metadata;
            }
            const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);
            return {
                id: subscription.id,
                customerId: subscription.customer,
                priceId: subscription.items.data[0]?.price.id || '',
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                metadata: subscription.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error updating subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }
    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, immediate = false) {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
                at_period_end: !immediate,
            });
            return {
                id: subscription.id,
                customerId: subscription.customer,
                priceId: subscription.items.data[0]?.price.id || '',
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                metadata: subscription.metadata || undefined,
            };
        }
        catch (error) {
            console.error('Error cancelling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }
    /**
     * Create a checkout session for one-time payment
     */
    async createCheckoutSession(priceId, customerId, successUrl, cancelUrl, metadata) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                customer: customerId,
                success_url: successUrl || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
                metadata,
            });
            return {
                sessionId: session.id,
                url: session.url || '',
            };
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }
    /**
     * Create a checkout session for subscription
     */
    async createSubscriptionCheckoutSession(priceId, customerId, successUrl, cancelUrl, metadata, trialPeriodDays) {
        try {
            const sessionData = {
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                customer: customerId,
                success_url: successUrl || `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/subscription/cancel`,
                metadata,
                subscription_data: trialPeriodDays ? {
                    trial_period_days: trialPeriodDays,
                } : undefined,
            };
            const session = await this.stripe.checkout.sessions.create(sessionData);
            return {
                sessionId: session.id,
                url: session.url || '',
            };
        }
        catch (error) {
            console.error('Error creating subscription checkout session:', error);
            throw new Error('Failed to create subscription checkout session');
        }
    }
    /**
     * Create a customer portal session
     */
    async createPortalSession(customerId, returnUrl) {
        try {
            const session = await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl || `${process.env.FRONTEND_URL}/account/billing`,
            });
            return {
                sessionId: session.id,
                url: session.url || '',
            };
        }
        catch (error) {
            console.error('Error creating portal session:', error);
            throw new Error('Failed to create portal session');
        }
    }
    /**
     * Handle webhook event
     */
    async handleWebhook(body, signature, webhookSecret) {
        try {
            return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
        }
        catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw new Error('Invalid webhook signature');
        }
    }
    /**
     * Get payment methods for a customer
     */
    async getPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            console.error('Error retrieving payment methods:', error);
            return [];
        }
    }
    /**
     * Set default payment method for customer
     */
    async setDefaultPaymentMethod(customerId, paymentMethodId) {
        try {
            await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }
        catch (error) {
            console.error('Error setting default payment method:', error);
            throw new Error('Failed to set default payment method');
        }
    }
    /**
     * Create an invoice
     */
    async createInvoice(customerId, description, metadata) {
        try {
            return await this.stripe.invoices.create({
                customer: customerId,
                description,
                metadata,
                auto_advance: true,
            });
        }
        catch (error) {
            console.error('Error creating invoice:', error);
            throw new Error('Failed to create invoice');
        }
    }
    /**
     * Get invoice by ID
     */
    async getInvoice(invoiceId) {
        try {
            return await this.stripe.invoices.retrieve(invoiceId);
        }
        catch (error) {
            console.error('Error retrieving invoice:', error);
            return null;
        }
    }
    /**
     * List invoices for a customer
     */
    async listInvoices(customerId, limit = 10, startingAfter) {
        try {
            return await this.stripe.invoices.list({
                customer: customerId,
                limit,
                starting_after: startingAfter,
            });
        }
        catch (error) {
            console.error('Error listing invoices:', error);
            throw new Error('Failed to list invoices');
        }
    }
}
// Default instance with environment variables
export const paymentService = new PaymentService(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key');
