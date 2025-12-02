import { MercadoPagoConfig, Payment, PreApproval, Customer } from "mercadopago";

// Initialize Mercado Pago SDK
// Access token should be loaded from environment variables
const getClient = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN environment variable is required");
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
    },
  });
};

export interface CreateSubscriptionParams {
  email: string;
  firstName: string;
  lastName: string;
  planTier: "starter" | "professional" | "enterprise";
  billingInterval: "monthly" | "annual";
}

export interface SubscriptionResponse {
  id: string;
  initPoint: string; // URL to redirect user for payment
  status: string;
  customerId: string;
}

/**
 * MercadoPago Service for handling subscription payments
 *
 * Key features:
 * - Create recurring subscriptions (PIX Automático, Credit Card, Boleto)
 * - Manage customer profiles
 * - Process webhooks for payment notifications
 * - Cancel and update subscriptions
 */
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private payment: Payment;
  private preApproval: PreApproval;
  private customer: Customer;

  constructor() {
    this.client = getClient();
    this.payment = new Payment(this.client);
    this.preApproval = new PreApproval(this.client);
    this.customer = new Customer(this.client);
  }

  /**
   * Get plan price based on tier and interval
   */
  private getPlanPrice(planTier: string, billingInterval: string): number {
    const prices: Record<string, { monthly: number; annual: number }> = {
      starter: { monthly: 79, annual: 758.40 },
      professional: { monthly: 149, annual: 1430.40 },
      enterprise: { monthly: 299, annual: 2870.40 },
    };

    const plan = prices[planTier];
    if (!plan) {
      throw new Error(`Invalid plan tier: ${planTier}`);
    }

    return billingInterval === "annual" ? plan.annual : plan.monthly;
  }

  /**
   * Get plan name in Portuguese
   */
  private getPlanName(planTier: string): string {
    const names: Record<string, string> = {
      starter: "Iniciante",
      professional: "Profissional",
      enterprise: "Corporativo",
    };
    return names[planTier] || planTier;
  }

  /**
   * Create or get Mercado Pago customer
   */
  async createOrGetCustomer(email: string, firstName: string, lastName: string): Promise<string> {
    try {
      // Search for existing customer
      const searchResult = await this.customer.search({
        options: {
          email,
        },
      });

      if (searchResult.results && searchResult.results.length > 0) {
        return searchResult.results[0].id!;
      }

      // Create new customer
      const customerData = await this.customer.create({
        body: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
      });

      return customerData.id!;
    } catch (error: any) {
      console.error("Error creating/getting customer:", error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Create a subscription (preapproval) in Mercado Pago
   *
   * @returns Subscription data including init_point URL for payment
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse> {
    try {
      const { email, firstName, lastName, planTier, billingInterval } = params;

      // Get or create customer
      const customerId = await this.createOrGetCustomer(email, firstName, lastName);

      // Calculate pricing
      const amount = this.getPlanPrice(planTier, billingInterval);
      const planName = this.getPlanName(planTier);
      const billingText = billingInterval === "annual" ? "Anual" : "Mensal";

      // Set up billing frequency
      const frequency = billingInterval === "annual" ? 12 : 1;
      const frequencyType = "months";

      // Create preapproval (subscription)
      const preapproval = await this.preApproval.create({
        body: {
          reason: `NutriOffice - Plano ${planName} (${billingText})`,
          auto_recurring: {
            frequency,
            frequency_type: frequencyType,
            transaction_amount: amount,
            currency_id: "BRL",
          },
          back_url: `${process.env.FRONTEND_URL}/subscription/callback`,
          payer_email: email,
          status: "pending",
        },
      });

      return {
        id: preapproval.id!,
        initPoint: preapproval.init_point!,
        status: preapproval.status!,
        customerId,
      };
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: "cancelled",
        },
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      return await this.preApproval.get({ id: subscriptionId });
    } catch (error: any) {
      console.error("Error getting subscription:", error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    try {
      return await this.payment.get({ id: paymentId });
    } catch (error: any) {
      console.error("Error getting payment:", error);
      throw new Error(`Failed to get payment: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * Mercado Pago sends x-signature and x-request-id headers
   */
  verifyWebhookSignature(
    requestBody: any,
    signature: string,
    requestId: string
  ): boolean {
    // For production: implement proper signature verification
    // See: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

    // Mercado Pago uses HMAC-SHA256 with your webhook secret
    // For now, return true but this MUST be implemented before production
    console.warn("Webhook signature verification not implemented - IMPLEMENT BEFORE PRODUCTION");
    return true;
  }

  /**
   * Process webhook notification
   *
   * Mercado Pago sends notifications for:
   * - payment (one-time payments)
   * - subscription_preapproval (subscription created/updated)
   * - subscription_preapproval_plan (plan changes)
   * - subscription_authorized_payment (recurring payment processed)
   */
  async processWebhook(webhookData: any) {
    const { type, action, data } = webhookData;

    console.log("Processing webhook:", { type, action, dataId: data?.id });

    switch (type) {
      case "payment":
        // Handle payment notification
        if (data?.id) {
          const payment = await this.getPayment(data.id);
          return {
            type: "payment",
            action,
            payment,
          };
        }
        break;

      case "subscription_preapproval":
      case "subscription_authorized_payment":
        // Handle subscription notification
        if (data?.id) {
          const subscription = await this.getSubscription(data.id);
          return {
            type: "subscription",
            action,
            subscription,
          };
        }
        break;

      default:
        console.warn("Unhandled webhook type:", type);
    }

    return null;
  }
}

// Singleton instance
let mercadoPagoService: MercadoPagoService | null = null;

export const getMercadoPagoService = (): MercadoPagoService => {
  if (!mercadoPagoService) {
    mercadoPagoService = new MercadoPagoService();
  }
  return mercadoPagoService;
};
