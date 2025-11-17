import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'));
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
      source: token,
    });
  }

  async createCharge(amount: number, currency: string, customerId: string, description: string) {
    return await this.stripe.charges.create({
      amount,
      currency,
      customer: customerId,
      description,
    });
  }
}
