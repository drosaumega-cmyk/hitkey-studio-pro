import Stripe from "stripe";
import { Context } from "hono";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-12-15.clover", // ✅ Latest confirmed version
});

export class WebhookHandler {
  constructor(private db: any) {}

  async handle(c: Context) {
    const rawBody = await c.req.text();
    const sig = c.req.header("stripe-signature");
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );

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
      
    } catch (err: any) {
      console.error("❌ Webhook Error:", err.message);
      return c.text(`Webhook Error: ${err.message}`, 400);
    }
  }
}


    