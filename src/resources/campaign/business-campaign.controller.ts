import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/role.enum";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Business } from "../business/entities/business.entity";
import { CampaignService } from "./campaign.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PaginatedCustomerActivityResponseDto } from "./dto/customer-activity-response.dto";
import {
  CapabilityService,
  ActionType,
} from "../capability/capability.service";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { ClaimCampaignDto } from "./dto/claim-campaign.dto";

@ApiTags("Business Campaigns")
@ApiBearerAuth()
@Roles(Role.Business)
@Controller("business/campaigns")
export class BusinessCampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly capabilityService: CapabilityService,
  ) {}

  @Get("claimable")
  @ApiOperation({ summary: "Get all claimable campaigns for a business" })
  async findClaimableCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findClaimableCampaigns(
      business.id,
      paginationDto,
    );
  }

  @Post(":campaignId/claim")
  @ApiOperation({ summary: "Claim an admin-created campaign" })
  async claimCampaign(
    @CurrentUser() business: Business,
    @Param("campaignId", ParseUUIDPipe) campaignId: string,
    @Body() claimCampaignDto: ClaimCampaignDto,
  ) {
    // Fetch campaign to check rewards and ensure it's a template
    const campaign = await this.campaignService.findOne(campaignId);

    // Ensure it's a Campaign (not BusinessCampaign) and has no business (template)
    // Note: findOne might return BusinessCampaign if ID matches, but claimCampaign service also checks.

    // Use the count of rewards the business is trying to add
    const rewardCount = claimCampaignDto.business_reward_ids.length;

    await this.capabilityService.checkPermission(
      business.id,
      ActionType.CREATE_CAMPAIGN,
      {
        isFromScratch: false,
        rewardCount,
      },
    );

    return this.campaignService.claimCampaign(
      business.id,
      campaignId,
      claimCampaignDto.business_reward_ids,
      claimCampaignDto.start_date,
      claimCampaignDto.end_date,
      claimCampaignDto.total_slots,
    );
  }

  @Get("my-created-campaigns")
  @ApiOperation({ summary: "Get all campaigns created by the business" })
  async findMyCreatedCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByBusiness(business.id, paginationDto);
  }

  @Get("my-claimed-campaigns")
  @ApiOperation({ summary: "Get all campaigns claimed by the business" })
  async findMyClaimedCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByBusiness(business.id, paginationDto);
  }

  @Get("analytics")
  @ApiOperation({
    summary: "Get analytics for all campaigns associated with the business",
  })
  async getCampaignAnalytics(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    // Mapping to getAnalytics which expects CampaignAnalyticsQueryDto
    return this.campaignService.getAnalytics(business, {
      ...paginationDto,
    } as any);
  }

  @Get(":campaignId/analytics/detailed")
  @ApiOperation({ summary: "Get detailed analytics for a campaign" })
  async getDetailedCampaignAnalytics(
    @CurrentUser() business: Business,
    @Param("campaignId", ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignService.getCampaignAnalytics(campaignId, business.id);
  }

  @Get("activities")
  @ApiOperation({
    summary: "Get history of customer activities for the business",
  })
  async getBusinessCustomerActivities(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedCustomerActivityResponseDto> {
    return this.campaignService.getBusinessCustomerActivities(
      business.id,
      paginationDto,
    );
  }

  @Get("activities/:participantId")
  @ApiOperation({ summary: "Get activity timeline for a specific participant" })
  async getParticipantActivityTimeline(
    @CurrentUser() business: Business,
    @Param("participantId", ParseUUIDPipe) participantId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedCustomerActivityResponseDto> {
    return this.campaignService.getParticipantActivityTimeline(
      business.id,
      participantId,
      paginationDto,
    );
  }
  @Patch(":id")
  @ApiOperation({ summary: "Update a business campaign" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() business: Business,
  ) {
    // We reuse the campaignService.update which now has the logic
    return this.campaignService.update(id, updateCampaignDto, business);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a business campaign" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() business: Business,
  ) {
    return this.campaignService.removeBusinessCampaign(id, business);
  }
}
