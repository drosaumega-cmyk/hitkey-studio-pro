import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover", // ✅ Latest confirmed version
});
export class WebhookHandler {
    db;
    constructor(db) {
        this.db = db;
    }
    async handle(c) {
        const rawBody = await c.req.text();
        const sig = c.req.header("stripe-signature");
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
            console.log(`✅ Received Stripe event: ${event.type}`);
            switch (event.type) {
                case "checkout.session.completed":
                    console.log("💰 Payment succeeded:", event.id);
                    break;
                case "invoice.payment_failed":
                    console.warn("⚠️ Payment failed:", event.id);
                    break;
                case "customer.subscription.deleted":
                    console.log("💔 Subscription cancelled:", event.id);
                    break;
                default:
                    console.log("ℹ️ Unhandled event type:", event.type);
            }
            // ✅ This line is essential — it finalizes Hono’s context.
            return c.json({ received: true }, 200);
        }
        catch (err) {
            console.error("❌ Webhook Error:", err.message);
            return c.text(`Webhook Error: ${err.message}`, 400);
        }
    }
}
