import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { CampaignService } from "./campaign.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import {
  UpdateCampaignDto,
  UpdateCampaignAdminDto,
} from "./dto/update-campaign.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Business } from "../business/entities/business.entity";
import { Admin } from "../admin/entities/admin.entity";
import { Public } from "src/common/decorators/public.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { CampaignAnalyticsQueryDto } from "./dto/campaign-analytics-query.dto";
import { PublicCampaignQueryDto } from "./dto/public-campaign-query.dto";
import { User } from "src/common/interfaces/user.interface";
import { CreateCampaignAdminDto } from "./dto/create-campaign-admin.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Campaign } from "./entities/campaign.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { CreateCampaignFromWishlistDto } from "./dto/create-campaign-from-wishlist.dto";
import {
  CapabilityService,
  ActionType,
} from "../capability/capability.service";
import { CapabilitiesGuard } from "../capability/guards/capabilities.guard";
import { CheckPermission } from "../capability/decorators/check-permission.decorator";
import { PaginatedCampaignResponseDto } from "./dto/paginated-campaign-response.dto";
import { TierAnalyticsResponseDto } from "./dto/tier-analytics-response.dto";

@ApiTags("Campaigns")
@Controller("campaigns")
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard, CapabilitiesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({
    summary: "Create a new campaign",
    description: "Accessible by Admins and Business Owners.",
  })
  @ApiExtraModels(CreateCampaignDto, CreateCampaignAdminDto)
  @ApiBody({
    description: "Payload for creating a new campaign",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateCampaignDto) },
        { $ref: getSchemaPath(CreateCampaignAdminDto) },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: "The campaign has been successfully created.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Campaign) },
        { $ref: getSchemaPath(BusinessCampaign) },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @CheckPermission(ActionType.CREATE_CAMPAIGN, { isFromScratch: true })
  async create(
    @Body() createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.create(createCampaignDto, currentUser);
  }

  @Post("from-wishlist")
  @ApiBearerAuth()
  @UseGuards(RolesGuard, CapabilitiesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({
    summary: "Create a new campaign from a wishlist aggregate",
    description: "Accessible by Admins and Business Owners.",
  })
  @ApiBody({ type: CreateCampaignFromWishlistDto })
  @ApiResponse({
    status: 201,
    description: "The campaign has been successfully created.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Campaign) },
        { $ref: getSchemaPath(BusinessCampaign) },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Wishlist aggregate not found." })
  @CheckPermission(ActionType.CREATE_CAMPAIGN, { isFromScratch: false })
  createFromWishlist(
    @Body() createCampaignDto: CreateCampaignFromWishlistDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.createFromWishlist(
      createCampaignDto,
      currentUser,
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({
    summary: "Get all campaigns for the current user",
    description:
      "Admins get all campaigns, Business Owners get their own campaigns.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of campaigns.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findAll(
    @CurrentUser() currentUser: Business | Admin,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAll(currentUser, paginationDto);
  }

  @Get("joined")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Business)
  @ApiOperation({
    summary: "Get campaigns joined by the business",
    description: "Accessible by Business Owners.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of joined campaigns.",
  })
  findJoined(
    @CurrentUser() currentUser: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findJoinedCampaigns(
      currentUser.id,
      paginationDto,
    );
  }

  @Get("business/:businessId")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Get all campaigns for a specific business",
    description: "Accessible by Admins.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of campaigns for the business.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findAllByBusiness(
    @Param("businessId", ParseUUIDPipe) businessId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByBusiness(businessId, paginationDto);
  }

  @Get("admin")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Business)
  @ApiOperation({
    summary: "Get all campaigns created by admins",
    description: "Accessible by Business Owners.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of admin-created campaigns.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findAllByAdmin(@Query() paginationDto: PaginationDto) {
    return this.campaignService.findAllByAdmin(paginationDto);
  }

  @Get("admins")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Get all campaigns created by other admins",
    description: "Accessible by Admins only.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of admin-created campaigns.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findAllByOtherAdmins(
    @CurrentUser() currentUser: Admin,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByOtherAdmins(
      currentUser,
      paginationDto,
    );
  }

  @Get("ongoing")
  @Public()
  @ApiOperation({ summary: "Get all ongoing campaigns" })
  @ApiResponse({
    status: 200,
    description: "Returns a list of ongoing campaigns.",
  })
  findOngoingCampaigns() {
    return this.campaignService.findOngoingCampaigns();
  }

  @Get("staff/ongoing")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Staff, Role.Business)
  @ApiOperation({
    summary:
      "Get all ongoing campaigns for the staff's business or the business itself",
    description: "Accessible by Staff and Business Owners.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of ongoing campaigns.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findOngoingForStaff(
    @CurrentUser() currentUser: User,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findOngoingForStaff(currentUser, paginationDto);
  }

  @Get("participant/search")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Staff, Role.Business)
  @ApiOperation({
    summary:
      "Search for a participant and get their campaigns for the business",
    description:
      "Accessible by Staff and Business. Search by email or unique code.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of campaigns the participant is in.",
    type: [Campaign],
  })
  @ApiResponse({ status: 404, description: "Participant not found." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findParticipantCampaignsForBusiness(
    @CurrentUser() currentUser: User,
    @Query("query") query: string,
  ) {
    return this.campaignService.findParticipantCampaignsForBusiness(
      currentUser,
      query,
    );
  }

  @Get("all/public")
  @Public()
  @ApiOperation({ summary: "Get all public campaigns" })
  @ApiResponse({
    status: 200,
    description: "Returns a paginated list of public campaigns.",
  })
  findAllPublic(@Query() query: PublicCampaignQueryDto) {
    return this.campaignService.findAllPublic(query);
  }

  @Get("public/business-campaign/:identifier")
  @Public()
  @ApiOperation({
    summary: "Get a public business campaign by unique code or ID",
  })
  @ApiExtraModels(BusinessCampaign, Campaign)
  @ApiResponse({
    status: 200,
    description: "Returns the campaign details.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(BusinessCampaign) },
        { $ref: getSchemaPath(Campaign) },
      ],
    },
  })
  @ApiResponse({ status: 404, description: "Campaign not found." })
  @ApiResponse({
    status: 400,
    description: "Campaign has expired or is disabled.",
  })
  findOnePublicBusinessCampaign(@Param("identifier") identifier: string) {
    return this.campaignService.findPublicCampaign(identifier);
  }

  @Get("analytics")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Business)
  @ApiOperation({
    summary: "Get campaign analytics for the business.",
    description: "Accessible by Business Owners. Can be filtered by campaign.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the campaign analytics.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  getAnalytics(
    @CurrentUser() currentUser: User,
    @Query() query: CampaignAnalyticsQueryDto,
  ) {
    return this.campaignService.getAnalytics(currentUser, query);
  }

  @Get(":id/analytics/tiers")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Get tier-wise analytics for a campaign template",
    description: "Accessible by Admins.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns analytics grouped by tier.",
    type: TierAnalyticsResponseDto,
  })
  @ApiResponse({ status: 404, description: "Campaign not found." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  getTierAnalytics(@Param("id", ParseUUIDPipe) id: string) {
    return this.campaignService.getTierAnalytics(id);
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Public: Get a campaign by ID" })
  @ApiResponse({ status: 200, description: "Returns the campaign." })
  @ApiResponse({ status: 404, description: "Campaign not found." })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.findOne(id, currentUser);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(RolesGuard, CapabilitiesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Update a campaign" })
  @ApiExtraModels(UpdateCampaignDto, UpdateCampaignAdminDto)
  @ApiBody({
    description: "Payload for updating a campaign",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UpdateCampaignDto) },
        { $ref: getSchemaPath(UpdateCampaignAdminDto) },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: "The campaign has been successfully updated.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Campaign) },
        { $ref: getSchemaPath(BusinessCampaign) },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({
    status: 400,
    description: "Bad Request. Possible invalid reward IDs for role.",
  })
  @ApiResponse({ status: 404, description: "Campaign not found." })
  @CheckPermission(ActionType.UPDATE_CAMPAIGN)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto | UpdateCampaignAdminDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.update(id, updateCampaignDto, currentUser);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Delete a campaign template" })
  @ApiResponse({
    status: 200,
    description: "The campaign template has been successfully deleted.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Campaign template not found." })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Admin,
  ) {
    return this.campaignService.removeTemplate(id, currentUser);
  }

  @Patch(":id/toggle")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Toggle the status of a campaign" })
  @ApiResponse({
    status: 200,
    description: "The campaign status has been successfully toggled.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Campaign) },
        { $ref: getSchemaPath(BusinessCampaign) },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Campaign not found." })
  toggleCampaignStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.toggleCampaignStatus(id, currentUser);
  }
}
