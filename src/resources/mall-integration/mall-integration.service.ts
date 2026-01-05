import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class MallIntegrationService {
  private mallApiUrl: string;
  private apiKey: string;
  private ssoSecret: string;
  private mallFrontendUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.mallApiUrl =
      this.configService.get<string>("MALL_API_URL") || "http://localhost:3001"; // Default fallback
    this.apiKey =
      this.configService.get<string>("MALL_API_KEY") || "secret-system-key";
    this.ssoSecret =
      this.configService.get<string>("SSO_SECRET") ||
      "shared-sso-secret-key-123";
    this.mallFrontendUrl =
      this.configService.get<string>("MALL_FRONTEND_URL") ||
      "http://localhost:3000";
  }

  async generateSsoToken(user: {
    email: string;
    name: string;
    role: "business" | "participant";
    phoneNumber?: string;
  }) {
    const payload = {
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber,
      iss: "mcom-loyalty",
      aud: "mcom-mall",
    };

    const token = this.jwtService.sign(payload, {
      secret: this.ssoSecret,
      expiresIn: "5m",
    });

    return {
      token,
      redirectUrl: `${this.mallFrontendUrl}/sso-login?token=${token}`,
    };
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
        this.httpService.post(`${this.mallApiUrl}${endpoint}`, payload, {
          headers: {
            "x-system-api-key": this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error calling Mall API (${endpoint}):`,
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        "Failed to generate external reward in Mall API",
      );
    }
  }
}
