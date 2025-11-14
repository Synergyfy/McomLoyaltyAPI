import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Environment, OrdersController, OrderRequest, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { PlanType } from '../membership/entities/membership.entity';

@Injectable()
export class PaypalService {
  private readonly client: Client;
  private readonly orders: OrdersController;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      environment: Environment.Sandbox,
    });
    this.orders = new OrdersController(this.client);
  }

  async createOrder(amount: number, currency: string, tierId: string, planType: PlanType) {
    const request: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: tierId,
          description: planType,
          amount: {
            currencyCode: currency,
            value: amount.toString(),
          },
        },
      ],
    };
    const response = await this.orders.createOrder({ body: request });
    return response;
  }

  async capturePayment(orderId: string) {
    const response = await this.orders.captureOrder({ id: orderId });
    return response;
  }
}
