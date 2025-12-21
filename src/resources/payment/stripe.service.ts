import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  public readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>("STRIPE_SECRET_KEY"),
    );
  }

  async createPaymentIntent(amount: number, currency: string, metadata: any) {
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });
  }

  async verifyPayment(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createCustomer(name: string, email: string, token: string) {
    return await this.stripe.customers.create({
      name,
      email,
      payment_method: token,
      invoice_settings: {
        default_payment_method: token,
      },
    });
  }

  async createCharge(
    amount: number,
    currency: string,
    customerId: string,
    description: string,
  ) {
    return await this.stripe.charges.create({
      amount,
      currency,
      customer: customerId,
      description,
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    trialPeriodDays?: number,
  ) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialPeriodDays,
    });
  }

  async getPriceForProduct(productId: string) {
    const prices = await this.stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });
    return prices.data.length > 0 ? prices.data[0].id : null;
  }

  constructWebhookEvent(payload: Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
