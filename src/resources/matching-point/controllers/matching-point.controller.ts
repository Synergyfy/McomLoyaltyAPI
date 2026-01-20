import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
  ForbiddenException,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { MatchingPointService } from "../services/matching-point.service";
import { MatchingPointConfig } from "../entities/matching-point-config.entity";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { UpdateMatchingPointConfigDto } from "../dto/update-config.dto";
import { ManualAdjustmentDto } from "../dto/manual-adjustment.dto";
import { GetMatchingPointHistoryDto } from "../dto/get-history.dto";
import { CreateMatchingPointRewardDto } from "../dto/create-matching-point-reward.dto";
import { UpdateMatchingPointRewardDto } from "../dto/update-matching-point-reward.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { UserType } from "../entities/matching-point-redemption.entity";
import { MatchingPointReward } from "../entities/matching-point-reward.entity";
import { Public } from "../../../common/decorators/public.decorator";
import { GetMatchingPointRewardsFilterDto } from "../dto/get-rewards-filter.dto";
import { User } from "../../../common/interfaces/user.interface";

@ApiTags("Matching Points")
@Controller("matching-points")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class MatchingPointController {
  constructor(private readonly matchingPointService: MatchingPointService) {}

  // --- Configuration (Admin) ---

  @Get("config")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Get all matching point configurations (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "List of matching point configurations",
    type: [MatchingPointConfig],
  })
  async getAllConfig() {
    return this.matchingPointService.getConfig();
  }

  @Put("config")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update matching point configuration (Admin only)" })
  @ApiBody({ type: UpdateMatchingPointConfigDto })
  @ApiResponse({
    status: 200,
    description: "The updated configuration",
    type: MatchingPointConfig,
  })
  async updateConfig(@Body() updateConfigDto: UpdateMatchingPointConfigDto) {
    return this.matchingPointService.setConfig(
      updateConfigDto.activity_type,
      updateConfigDto.points,
      updateConfigDto.is_active,
    );
  }

  @Post("adjust")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Manually adjust matching points for a user (Admin only)",
  })
  @ApiBody({ type: ManualAdjustmentDto })
  async manualAdjustment(@Body() dto: ManualAdjustmentDto) {
    await this.matchingPointService.manualAdjustment(
      dto.userId,
      dto.userType,
      dto.points,
      dto.description,
    );
    return { success: true, message: "Points adjusted successfully" };
  }

  // --- Rewards Management ---

  @Post("rewards")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Create a matching point reward" })
  @ApiResponse({
    status: 201,
    description: "Reward created",
    type: MatchingPointReward,
  })
  async createReward(
    @Body() createDto: CreateMatchingPointRewardDto,
    @CurrentUser() user: User,
  ) {
    const creatorType = user.role === Role.Admin ? "ADMIN" : "SUPER_BUSINESS";
    return this.matchingPointService.createReward(
      createDto,
      user.id,
      creatorType,
    );
  }

  @Get("rewards/public")
  @Public()
  @ApiOperation({ summary: "Get all available matching point rewards" })
  @ApiResponse({
    status: 200,
    description: "Paginated list of rewards",
  })
  async getPublicRewards(@Query() filterDto: GetMatchingPointRewardsFilterDto) {
    return this.matchingPointService.getPublicRewards(filterDto);
  }

  @Get("rewards/created")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Get rewards created by the current user" })
  async getCreatorRewards(
    @Query() filterDto: GetMatchingPointRewardsFilterDto,
    @CurrentUser() user: User,
  ) {
    const creatorType = user.role === Role.Admin ? "ADMIN" : "BUSINESS";
    return this.matchingPointService.getCreatorRewards(
      user.id,
      creatorType,
      filterDto,
    );
  }

  @Get("rewards/redeemed")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Get redeemed matching point rewards" })
  async getRedeemedRewards(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ) {
    const userType =
      user.role === Role.Business ? UserType.BUSINESS : UserType.PARTICIPANT;
    return this.matchingPointService.getRedeemedRewards(
      user.id,
      userType,
      paginationDto,
    );
  }

  @Get("rewards/:id")
  @Public()
  @ApiOperation({ summary: "Get a specific matching point reward" })
  async getReward(@Param("id", ParseUUIDPipe) id: string) {
    return this.matchingPointService.getReward(id);
  }

  @Patch("rewards/:id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Update a matching point reward" })
  async updateReward(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMatchingPointRewardDto,
    @CurrentUser() user: User,
  ) {
    const role = user.role === Role.Admin ? "ADMIN" : "BUSINESS";
    return this.matchingPointService.updateReward(id, updateDto, user.id, role);
  }

  @Delete("rewards/:id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Delete a matching point reward" })
  async deleteReward(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const role = user.role === Role.Admin ? "ADMIN" : "BUSINESS";
    return this.matchingPointService.deleteReward(id, user.id, role);
  }

  @Patch("rewards/:id/suspend")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Suspend/Unsuspend a matching point reward" })
  async toggleSuspendReward(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const role = user.role === Role.Admin ? "ADMIN" : "BUSINESS";
    return this.matchingPointService.toggleSuspendReward(id, user.id, role);
  }

  // --- Redemption ---

  @Post("rewards/:id/redeem")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Redeem a matching point reward" })
  async redeemReward(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const userType =
      user.role === Role.Business ? UserType.BUSINESS : UserType.PARTICIPANT;
    return this.matchingPointService.redeemReward(id, user.id, userType);
  }

  // --- User History & Balance ---

  @Get("history")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Get matching point history" })
  async getHistory(
    @CurrentUser() user: User,
    @Query() queryDto: GetMatchingPointHistoryDto,
  ) {
    const userType =
      user.role === Role.Business ? UserType.BUSINESS : UserType.PARTICIPANT;
    return this.matchingPointService.getHistory(user.id, userType, queryDto);
  }

  @Get("balance")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Get current matching point balance" })
  async getBalance(@CurrentUser() user: User) {
    const userType =
      user.role === Role.Business ? UserType.BUSINESS : UserType.PARTICIPANT;
    return this.matchingPointService.getMatchingPointsBalance(
      user.id,
      userType,
    );
  }
}
