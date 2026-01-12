/**
 * Webhook handlers for payment processing and other integrations
 */
import { PaymentService } from '../lib/payments';
export class WebhookHandler {
    db;
    paymentService;
    constructor(db) {
        this.db = db;
        this.paymentService = new PaymentService(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key');
    }
    async handleStripeWebhook(c) {
        try {
            const body = await c.req.text();
            const signature = c.req.header('stripe-signature');
            if (!signature) {
                return c.json({ error: 'Missing signature' }, 400);
            }
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!webhookSecret) {
                return c.json({ error: 'Webhook secret not configured' }, 500);
            }
            const event = await this.paymentService.handleWebhook(body, signature, webhookSecret);
            console.log(`✅ Received Stripe event: ${event.type}`);
            // Optional: store event in database
            await this.db.executeRun('INSERT INTO webhook_events (type, payload) VALUES (?, ?)', [event.type, JSON.stringify(event)]);
            switch (event.type) {
                case 'checkout.session.completed':
                    console.log('💰 Payment succeeded');
                    break;
                case 'invoice.payment_failed':
                    console.warn('⚠️ Payment failed');
                    break;
                case 'customer.subscription.deleted':
                    console.log('🗑️ Subscription cancelled');
                    break;
                default:
                    console.log(`ℹ️ Unhandled event type: ${event.type}`);
            }
            return c.json({ success: true }, 200);
        }
        catch (err) {
            console.error('Stripe webhook error:', err);
            return c.json({ error: 'Webhook processing failed' }, 500);
        }
    }
}
