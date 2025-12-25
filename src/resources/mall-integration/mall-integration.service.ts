import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";

@Injectable()
export class MallIntegrationService {
  private mallApiUrl: string;
  private apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.mallApiUrl = this.configService.get<string>("MALL_API_URL") || "http://localhost:3001"; // Default fallback
    this.apiKey = this.configService.get<string>("MALL_API_KEY") || "secret-system-key";
  }

  async createVoucher(payload: {
    amount: number;
    recipientEmail: string;
    recipientName?: string;
    message?: string;
    businessName: string;
  }) {
    return this.postToSystem("/system/vouchers/create", payload);
  }

  async createGiftCard(payload: {
    amount: number;
    recipientEmail: string;
    recipientName?: string;
    message?: string;
    businessName: string;
  }) {
    return this.postToSystem("/system/gift-cards/create", payload);
  }

  async createCoupon(payload: {
    amount: number;
    recipientEmail: string;
    recipientName?: string;
    message?: string;
    businessName: string;
  }) {
    return this.postToSystem("/system/coupons/create", payload);
  }

  private async postToSystem(endpoint: string, payload: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.mallApiUrl}${endpoint}`,
          payload,
          {
            headers: {
              "x-system-api-key": this.apiKey,
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      console.error(`Error calling Mall API (${endpoint}):`, error.response?.data || error.message);
      throw new InternalServerErrorException("Failed to generate external reward in Mall API");
    }
  }
}
