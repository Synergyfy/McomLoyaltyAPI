import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Client,
  Environment,
  OrdersController,
  OrderRequest,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import { PlanType } from "../membership/entities/membership.entity";
import axios from "axios";

@Injectable()
export class PaypalService {
  private readonly client: Client;
  private readonly orders: OrdersController;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>("PAYPAL_CLIENT_ID");
    const clientSecret = this.configService.get<string>("PAYPAL_CLIENT_SECRET");
    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";
    const paypalMode = this.configService.get<string>("PAYPAL_MODE"); // Optional explicit override

    const useSandbox = paypalMode ? paypalMode !== "live" : !isProduction;

    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      environment: useSandbox ? Environment.Sandbox : Environment.Production,
    });
    this.orders = new OrdersController(this.client);
    this.baseUrl = useSandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>("PAYPAL_CLIENT_ID");
    const clientSecret = this.configService.get<string>("PAYPAL_CLIENT_SECRET");
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Set expiry slightly before actual expiry to be safe (e.g., 60 seconds buffer)
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;

      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to get PayPal access token: ${error.message}`);
    }
  }

  async createOrder(
    amount: number,
    currency: string,
    tierId: string,
    description: string,
  ) {
    const request: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: tierId,
          description: description,
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

  async createPointPurchaseOrder(
    amount: number,
    currency: string,
    businessId: string,
    points: number,
  ) {
    const request: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: businessId,
          description: `Point Purchase: ${points} Points`,
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

  async createPackagePurchaseOrder(
    amount: number,
    currency: string,
    businessId: string,
    packageId: string,
    packageType: string,
    packageName: string,
  ) {
    const request: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: businessId,
          description: `${packageType} Package Purchase: ${packageName}`,
          amount: {
            currencyCode: currency,
            value: amount.toString(),
          },
          customId: `${packageId}|${packageType}`, // Store package info in custom_id
        } as any,
      ],
    };
    const response = await this.orders.createOrder({ body: request });
    return response;
  }

  async capturePayment(orderId: string) {
    const response = await this.orders.captureOrder({ id: orderId });
    return response;
  }

  async createSubscription(
    planId: string,
    returnUrl: string,
    cancelUrl: string,
  ) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/billing/subscriptions`,
        {
          plan_id: planId,
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            user_action: "SUBSCRIBE_NOW",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Find the approval link
      const approvalLink = response.data.links.find(
        (link: any) => link.rel === "approve",
      );
      return {
        subscriptionId: response.data.id,
        approvalUrl: approvalLink ? approvalLink.href : null,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(
        `Failed to create PayPal subscription: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  async getSubscription(subscriptionId: string) {
    const accessToken = await this.getAccessToken();
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get PayPal subscription: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}
