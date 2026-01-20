import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Patch,
  Delete,
  Request,
  UseGuards,
} from "@nestjs/common";
import { BusinessService } from "../services/business.service";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { UpdateBusinessProfileDto } from "../dto/update-business-profile.dto";
import { OnboardingDto } from "../dto/onboarding.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { SkipMembershipCheck } from "../../../common/decorators/skip-membership-check.decorator";
import { PointPurchaseConfigDto } from "../dto/point-purchase-config.dto";
import { ReferralStatsResponseDto } from "../dto/referral-stats-response.dto";

@ApiTags("Business Lifecycle")
@Controller("business")
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "Create a new business profile" })
  @ApiResponse({
    status: 201,
    description: "The business profile has been successfully created.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input or email/name already exists.",
  })
  @ApiBody({ type: CreateBusinessDto })
  async create(
    @Body(new ValidationPipe()) createBusinessDto: CreateBusinessDto,
  ) {
    return this.businessService.create(createBusinessDto);
  }

  @ApiBearerAuth()
  @Roles(Role.Business)
  @SkipMembershipCheck()
  @Post("onboarding")
  @ApiOperation({ summary: "Onboard a new business with additional details" })
  @ApiResponse({
    status: 201,
    description: "The business has been successfully onboarded.",
  })
  @ApiResponse({ status: 400, description: "Invalid input." })
  @ApiBody({ type: OnboardingDto })
  async onboarding(
    @Request() req,
    @Body(new ValidationPipe()) onboardingDto: OnboardingDto,
  ) {
    return this.businessService.onboarding(req.user.id, onboardingDto);
  }

  @Roles(Role.Business)
  @Get("profile")
  @ApiOperation({ summary: "Get business profile" })
  @ApiResponse({ status: 200, description: "Return business profile." })
  async getProfile(@Request() req) {
    return this.businessService.findById(req.user.id, [
      "sector",
      "category",
      "subCategory",
    ]);
  }

  @Roles(Role.Business)
  @Patch("profile")
  @ApiOperation({ summary: "Update business profile" })
  @ApiResponse({
    status: 200,
    description: "The business profile has been successfully updated.",
  })
  @ApiBody({ type: UpdateBusinessDto })
  async updateProfile(
    @Request() req,
    @Body(new ValidationPipe()) updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.update(req.user.id, updateBusinessDto);
  }

  @Roles(Role.Business)
  @SkipMembershipCheck()
  @Get("subscription")
  @ApiOperation({ summary: "Get business subscription level" })
  @ApiResponse({
    status: 200,
    description: "Return business subscription details.",
  })
  async getSubscription(@Request() req) {
    return this.businessService.getSubscriptionLevel(req.user.id);
  }

  @Roles(Role.Business)
  @Get("billing-history")
  @ApiOperation({ summary: "Get business billing history" })
  @ApiResponse({ status: 200, description: "Return business billing history." })
  async getBillingHistory(@Request() req) {
    return this.businessService.getBillingHistory(req.user.id);
  }

  @Roles(Role.Business)
  @Get("onboarding-status")
  @ApiOperation({ summary: "Get business onboarding status" })
  @ApiResponse({
    status: 200,
    description: "Return business onboarding status.",
  })
  async getOnboardingStatus(@Request() req) {
    return this.businessService.getOnboardingStatus(req.user.id);
  }

  @Roles(Role.Business)
  @Delete("profile")
  @ApiOperation({ summary: "Delete business profile" })
  @ApiResponse({
    status: 200,
    description: "The business profile has been successfully deleted.",
  })
  async deleteProfile(@Request() req) {
    return this.businessService.delete(req.user.id);
  }
  @Roles(Role.Business)
  @Get("points/balance/monthly")
  @ApiOperation({ summary: "Get monthly point balance" })
  @ApiResponse({ status: 200, description: "Return monthly point balance." })
  async getMonthlyPointBalance(@Request() req) {
    return this.businessService.getMonthlyPointBalance(req.user.id);
  }

  @Roles(Role.Business)
  @Get("stamps/balance/monthly")
  @ApiOperation({ summary: "Get monthly stamp balance" })
  @ApiResponse({ status: 200, description: "Return monthly stamp balance." })
  async getMonthlyStampBalance(@Request() req) {
    return this.businessService.getMonthlyStampBalance(req.user.id);
  }

  @Roles(Role.Business)
  @Get("points/balance/total")
  @ApiOperation({ summary: "Get total subscription point balance" })
  @ApiResponse({
    status: 200,
    description: "Return total subscription point balance.",
  })
  async getTotalSubscriptionPointBalance(@Request() req) {
    return this.businessService.getTotalSubscriptionPointBalance(req.user.id);
  }

  // @Roles(Role.Business)
  // @Post('points/buy')
  // @ApiOperation({ summary: 'Buy extra points' })
  // @ApiResponse({ status: 200, description: 'Points purchased successfully.' })
  // @ApiBody({ type: BuyPointsDto })
  // async buyExtraPoints(@Request() req, @Body(new ValidationPipe()) buyPointsDto: BuyPointsDto) {
  //   return this.businessService.buyExtraPoints(req.user.id, buyPointsDto.points, buyPointsDto.provider);
  // }

  // @Roles(Role.Business)
  // @Post('points/buy/confirm')
  // @ApiOperation({ summary: 'Confirm point purchase' })
  // @ApiResponse({ status: 200, description: 'Point purchase confirmed.' })
  // @ApiBody({ type: ConfirmPointPurchaseDto })
  // async confirmPointPurchase(@Request() req, @Body(new ValidationPipe()) confirmDto: ConfirmPointPurchaseDto) {
  //   return this.businessService.confirmPointPurchase(req.user.id, confirmDto.transactionId, confirmDto.provider);
  // }

  @Roles(Role.Business)
  @Get("points/purchase-config")
  @ApiOperation({ summary: "Get point purchase configuration" })
  @ApiResponse({
    status: 200,
    description: "Return point purchase configuration.",
    type: PointPurchaseConfigDto,
  })
  async getPointPurchaseConfig(@Request() req) {
    return this.businessService.getPointPurchaseConfig(req.user.id);
  }

  @Roles(Role.Business)
  @Get("me")
  @ApiOperation({ summary: "Get current business profile" })
  @ApiResponse({ status: 200, description: "Return current business profile." })
  async getOwnProfile(@Request() req) {
    return this.businessService.getOwnProfile(req.user.id);
  }

  @Roles(Role.Business)
  @Patch("me")
  @ApiOperation({ summary: "Update current business profile" })
  @ApiResponse({
    status: 200,
    description: "The business profile has been successfully updated.",
  })
  @ApiBody({ type: UpdateBusinessProfileDto })
  async updateOwnProfile(
    @Request() req,
    @Body(new ValidationPipe())
    updateBusinessProfileDto: UpdateBusinessProfileDto,
  ) {
    return this.businessService.updateOwnProfile(
      req.user.id,
      updateBusinessProfileDto,
    );
  }
  @Roles(Role.Business)
  @Get("tier-usage")
  @ApiOperation({ summary: "Get business tier usage and limits" })
  @ApiResponse({
    status: 200,
    description: "Return business tier usage and limits.",
  })
  async getTierUsage(@Request() req) {
    return this.businessService.getTierUsage(req.user.id);
  }

  @Roles(Role.Business)
  @Get("referral-stats")
  @ApiOperation({ summary: "Get business referral capacity stats" })
  @ApiResponse({
    status: 200,
    description:
      "Return business referral stats (capacity, uploaded, remaining, percentage).",
    type: ReferralStatsResponseDto,
  })
  async getReferralStats(@Request() req) {
    return this.businessService.getReferralStats(req.user.id);
  }
}
