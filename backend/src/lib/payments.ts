/**
 * Payment processing service using Stripe
 */

import Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, string>;
}

export interface Price {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
  };
  metadata?: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class PaymentService {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }

  /**
   * Create a new customer
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        ...(metadata && { metadata }),
      });

      return {
        id: customer.id,
        email: (customer as any).email || '',
        name: (customer as any).name || undefined,
        metadata: (customer as any).metadata || undefined,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }
      
      return {
        id: customer.id,
        email: (customer as any).email || '',
        name: (customer as any).name || undefined,
        metadata: (customer as any).metadata || undefined,
      };
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, updates: {
    email?: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, updates);
      
      return {
        id: customer.id,
        email: (customer as any).email || '',
        name: (customer as any).name || undefined,
        metadata: (customer as any).metadata || undefined,
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
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
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a product
   */
  async createProduct(
    name: string,
    description?: string,
    metadata?: Record<string, string>
  ): Promise<Product> {
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
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Create a price for a product
   */
  async createPrice(
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    },
    metadata?: Record<string, string>
  ): Promise<Price> {
    try {
      const priceData: Stripe.PriceCreateParams = {
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
        productId: price.product as string,
        unitAmount: price.unit_amount || 0,
        currency: price.currency,
        recurring: price.recurring ? {
          interval: price.recurring.interval,
          ...(price.recurring.interval_count && { intervalCount: price.recurring.interval_count }),
        } : undefined,
        metadata: price.metadata || undefined,
      };
    } catch (error) {
      console.error('Error creating price:', error);
      throw new Error('Failed to create price');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>,
    trialPeriodDays?: number
  ): Promise<Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
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
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0]?.price.id || '',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        metadata: subscription.metadata || undefined,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0]?.price.id || '',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        metadata: subscription.metadata || undefined,
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      priceId?: string;
      cancelAtPeriodEnd?: boolean;
      metadata?: Record<string, string>;
    }
  ): Promise<Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};

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
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0]?.price.id || '',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        metadata: subscription.metadata || undefined,
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
        at_period_end: !immediate,
      } as any);

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0]?.price.id || '',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        metadata: subscription.metadata || undefined,
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create a checkout session for one-time payment
   */
  async createCheckoutSession(
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string,
    metadata?: Record<string, string>
  ): Promise<{ sessionId: string; url: string }> {
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
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createSubscriptionCheckoutSession(
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string,
    metadata?: Record<string, string>,
    trialPeriodDays?: number
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
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
    } catch (error) {
      console.error('Error creating subscription checkout session:', error);
      throw new Error('Failed to create subscription checkout session');
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl?: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/account/billing`,
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(
    body: string,
    signature: string,
    webhookSecret: string
  ): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      return [];
    }
  }

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    customerId: string,
    description?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.create({
        customer: customerId,
        description,
        metadata,
        auto_advance: true,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      return null;
    }
  }

  /**
   * List invoices for a customer
   */
  async listInvoices(
    customerId: string,
    limit: number = 10,
    startingAfter?: string
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    try {
      return await this.stripe.invoices.list({
        customer: customerId,
        limit,
        starting_after: startingAfter,
      });
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw new Error('Failed to list invoices');
    }
  }
}

// Default instance with environment variables
export const paymentService = new PaymentService(
  process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key'
);