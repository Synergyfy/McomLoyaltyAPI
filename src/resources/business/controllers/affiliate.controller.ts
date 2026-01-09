import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { BusinessService } from "../services/business.service";
import { ReferralService } from "../../referral/referral.service";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { User } from "../../../common/interfaces/user.interface";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { ReferralAnalyticsDto } from "../../referral/dto/referral-analytics.dto";

@ApiTags("Business Affiliate")
@ApiBearerAuth()
@Roles(Role.Business)
@Controller("business/affiliate")
export class AffiliateController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly referralService: ReferralService,
  ) {}

  @Get("code")
  @ApiOperation({ summary: "Get affiliate code" })
  @ApiResponse({ status: 200, description: "Affiliate code", type: String })
  async getAffiliateCode(@CurrentUser() user: User): Promise<string> {
    return this.businessService.getAffiliateCode(user.id);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Get referral analytics" })
  @ApiResponse({
    status: 200,
    description: "Referral analytics",
    type: ReferralAnalyticsDto,
  })
  async getReferralAnalytics(
    @CurrentUser() user: User,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: Date,
    @Query("endDate") endDate?: Date,
  ): Promise<ReferralAnalyticsDto> {
    return this.referralService.getBusinessReferralAnalytics(
      user.id,
      page,
      limit,
      search,
      status,
      startDate,
      endDate,
    );
  }
}
