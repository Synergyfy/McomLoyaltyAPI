import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CreateRewardDto } from "../dto/create-reward.dto";
import { RewardsService } from "../services/rewards.service";
import { UpdateRewardDto } from "../dto/update-reward.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { CreateBusinessRewardDto } from "../dto/create-business-reward.dto";
import { UpdateBusinessRewardDto } from "../dto/update-business-reward.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import {
  CapabilityService,
  ActionType,
} from "../../capability/capability.service";
import { CapabilitiesGuard } from "../../capability/guards/capabilities.guard";
import { CheckPermission } from "../../capability/decorators/check-permission.decorator";
import { UseGuards } from "@nestjs/common";

import { AddRewardToBusinessDto } from "../dto/add-reward-to-business.dto";
import { GetRewardsFilterDto } from "../dto/get-rewards-filter.dto";

@ApiTags("rewards")
@Controller("rewards")
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Admin endpoints
  @ApiOperation({ summary: "Admin: Create a new reward" })
  @ApiResponse({
    status: 201,
    description: "The reward has been successfully created.",
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post("admin/rewards")
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.createReward(createRewardDto);
  }

  @ApiOperation({ summary: "Admin: Get all rewards" })
  @ApiResponse({
    status: 200,
    description: "Return filtered rewards.",
    schema: {
      example: {
        data: [
          {
            id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            title: "Free Coffee",
            max_points: 1000,
            max_stamps_required: 10,
            reward_type: "Voucher",
            audience: "all business",
            is_points_enabled: true,
            is_stamps_enabled: true,
            stamp_emoji: "☕",
            status: "active",
            description: "A free coffee of your choice",
            image: "https://example.com/coffee.jpg",
            quantity: 100,
            disabled: false,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        next: null,
        previous: null,
      },
    },
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Get("admin/rewards")
  async getRewards(@Query() filterDto: GetRewardsFilterDto) {
    return this.rewardsService.getRewards({ ...filterDto, includeStats: true });
  }

  @ApiOperation({ summary: "Admin: Update a reward" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully updated.",
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Put("admin/rewards/:id")
  async updateReward(
    @Param("id") id: string,
    @Body() updateRewardDto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(id, updateRewardDto);
  }

  @ApiOperation({ summary: "Admin: Delete a reward" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully deleted.",
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Delete("admin/rewards/:id")
  async deleteReward(@Param("id") id: string) {
    return this.rewardsService.deleteReward(id);
  }

  @ApiOperation({ summary: "Admin: Disable a reward" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully disabled.",
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post("admin/rewards/:id/disable")
  async disableReward(@Param("id") id: string) {
    return this.rewardsService.disableReward(id);
  }

  @ApiOperation({ summary: "Admin: Enable a reward" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully enabled.",
  })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post("admin/rewards/:id/enable")
  async enableReward(@Param("id") id: string) {
    return this.rewardsService.enableReward(id);
  }

  // Business endpoints
  @ApiOperation({ summary: "Business: Get all rewards" })
  @ApiResponse({ status: 200, description: "Return all rewards." })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Get("business/rewards")
  async getBusinessRewards(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.rewardsService.getRewards({ page, limit });
  }

  @ApiOperation({ summary: "Business: Get all rewards added to a business" })
  @ApiResponse({
    status: 200,
    description: "Return all rewards for the business.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Get("business/my-added-rewards")
  async getMyBusinessRewards(
    @CurrentUser() user: any,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.rewardsService.getBusinessRewards(user.id, page, limit);
  }

  @ApiOperation({
    summary: "Business: Get rewards not yet added by the business",
  })
  @ApiResponse({
    status: 200,
    description: "Return rewards available to be added.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Get("business/unadded-rewards")
  async getUnaddedRewards(
    @CurrentUser() user: any,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
  ) {
    return this.rewardsService.getUnaddedRewards(user.id, page, limit, search);
  }

  @ApiOperation({ summary: "Business: Create a new reward" })
  @ApiResponse({
    status: 201,
    description: "The reward has been successfully created.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Post("business/rewards/create")
  @UseGuards(CapabilitiesGuard)
  @CheckPermission(ActionType.CREATE_REWARD)
  async createBusinessReward(
    @Body() createBusinessRewardDto: CreateBusinessRewardDto,
    @CurrentUser() user: any,
  ) {
    return this.rewardsService.createBusinessReward(
      user.id,
      createBusinessRewardDto,
    );
  }

  @ApiOperation({ summary: "Business: Add a reward to business" })
  @ApiResponse({
    status: 201,
    description: "The reward has been successfully added to the business.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Post("business/rewards/:rewardId")
  @UseGuards(CapabilitiesGuard)
  @CheckPermission(ActionType.ADD_REWARD_TO_BUSINESS)
  async addRewardToBusiness(
    @Param("rewardId") rewardId: string,
    @Body() addRewardToBusinessDto: AddRewardToBusinessDto,
    @CurrentUser() user: any,
  ) {
    return this.rewardsService.addRewardToBusiness(
      rewardId,
      user.id,
      addRewardToBusinessDto,
    );
  }

  @ApiOperation({ summary: "Business: Remove a reward from business" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully removed from the business.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Delete("business/rewards/:rewardId")
  async removeRewardFromBusiness(
    @Param("rewardId") rewardId: string,
    @CurrentUser() user: any,
  ) {
    return this.rewardsService.removeRewardFromBusiness(rewardId, user.id);
  }

  @ApiOperation({ summary: "Business: Update a reward" })
  @ApiResponse({
    status: 200,
    description: "The reward has been successfully updated.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Put("business/rewards/:id")
  @UseGuards(CapabilitiesGuard)
  @CheckPermission(ActionType.UPDATE_REWARD)
  async updateBusinessReward(
    @Param("id") id: string,
    @Body() updateBusinessRewardDto: UpdateBusinessRewardDto,
    @CurrentUser() user: any,
  ) {
    return this.rewardsService.updateBusinessReward(
      user.id,
      id,
      updateBusinessRewardDto,
    );
  }

  @ApiOperation({ summary: "Business: Get mall reward issuance history" })
  @ApiResponse({
    status: 200,
    description: "Return paginated mall reward history for the business.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Get("business/mall-reward-history")
  async getMallRewardHistory(
    @CurrentUser() user: any,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.rewardsService.getMallRewardHistory(user.id, page, limit);
  }

  @ApiOperation({ summary: "Business: Get mall reward statistics" })
  @ApiResponse({
    status: 200,
    description: "Return summary statistics for mall rewards.",
  })
  @Roles(Role.Business)
  @ApiBearerAuth()
  @Get("business/mall-reward-stats")
  async getMallRewardStats(@CurrentUser() user: any) {
    return this.rewardsService.getMallRewardStats(user.id);
  }

  @ApiOperation({ summary: "Participant: Get my mall reward history" })
  @ApiResponse({
    status: 200,
    description: "Return paginated mall reward history for the participant.",
  })
  @Roles(Role.Participant)
  @ApiBearerAuth()
  @Get("participant/mall-reward-history")
  async getParticipantMallRewardHistory(
    @CurrentUser() user: any,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.rewardsService.getParticipantMallRewardHistory(
      user.id,
      page,
      limit,
    );
  }
}
