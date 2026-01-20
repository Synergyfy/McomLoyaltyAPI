import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class CentralIntegrationService {
  private readonly logger = new Logger(CentralIntegrationService.name);
  private readonly centralUrl =
    process.env.MCOM_CENTRAL_URL || "http://localhost:3000/api/v1";

  async processCashback(
    userEmail: string,
    amountPaid: number,
    eventType: string,
    transactionReference: string,
  ) {
    try {
      const payload = {
        userEmail,
        platform: "MCOM_LOYALTY",
        eventType,
        amountPaid,
        transactionReference,
      };

      this.logger.log(
        `Sending cashback request to central: ${JSON.stringify(payload)}`,
      );

      // In a real scenario, we would use HttpService (Axios) to call mcom_central
      await axios.post(`${this.centralUrl}/cashback/process`, payload);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process cashback: ${error.message}`);
      // Don't throw error to avoid blocking the main payment flow
      return { success: false, error: error.message };
    }
  }

  async createCashbackRule(
    eventType: string,
    rewardType: "FIXED" | "PERCENTAGE",
    rewardValue: number,
    adminId: string,
  ) {
    try {
      const payload = {
        platform: "MCOM_LOYALTY",
        eventType,
        rewardType,
        rewardValue,
        adminId,
      };
      await axios.post(`${this.centralUrl}/cashback/rules`, payload);
      this.logger.log(
        `Created cashback rule on central: ${JSON.stringify(payload)}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to create cashback rule: ${error.message}`);
      throw error;
    }
  }

  async getCashbackBalance(userEmail: string): Promise<number> {
    try {
      const response = await axios.get(`${this.centralUrl}/cashback/balance`, {
        params: { email: userEmail },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get cashback balance: ${error.message}`);
      return 0;
    }
  }

  async getHistory(query: any) {
    try {
      const response = await axios.get(`${this.centralUrl}/cashback/history`, {
        params: query,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get cashback history: ${error.message}`);
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  }

  async getRules(platform?: string) {
    try {
      const params: any = {};
      if (platform) params.platform = platform;
      const response = await axios.get(`${this.centralUrl}/cashback/rules`, {
        params,
      });
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to get rules from central: ${error.message}`);
      return []; // Return empty array to prevent 500 error on public endpoint
    }
  }

  async getEvents() {
    try {
      const response = await axios.get(`${this.centralUrl}/cashback/events`, {
        params: { platform: "MCOM_LOYALTY" },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get events: ${error.message}`);
      throw error;
    }
  }

  async updateRule(id: string, updateDto: any) {
    try {
      const response = await axios.patch(
        `${this.centralUrl}/cashback/rules/${id}`,
        updateDto,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update rule: ${error.message}`);
      throw error;
    }
  }

  async deleteRule(id: string) {
    try {
      const response = await axios.delete(
        `${this.centralUrl}/cashback/rules/${id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to delete rule: ${error.message}`);
      throw error;
    }
  }
}
