import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { RedemptionService } from "./services/redemption.service";
import { PointEarningService } from "./services/point-earning.service";
import { TransactionCodeService } from "./services/transaction-code.service";
import { GenerateCodeDto } from "./dto/generate-code.dto";
import { ClaimCodeDto } from "./dto/claim-code.dto";
import { ScanParticipantDto } from "./dto/scan-participant.dto";
import { DualScanDto } from "./dto/dual-scan.dto";
import { IsJoinedDto } from "./dto/is-joined.dto";
import { AwardPointsDto } from "./dto/award-points.dto";
import { AwardStampsDto } from "./dto/award-stamps.dto";
import { RedeemRewardDto } from "./dto/redeem-reward.dto";
import { RedeemRewardSelfDto } from "./dto/redeem-reward-self.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Role } from "../../common/role.enum";
import { Roles } from "../../common/decorators/roles.decorator";
import { ParticipantCampaignBalance } from "./entities/participant-campaign-balance.entity";
import { ParticipantCampaignBalanceService } from "./services/participant-campaign-balance.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/common/interfaces/user.interface";
import { GetParticipantBalanceDto } from "./dto/get-participant-balance.dto";
import { GetParticipantBalanceForCampaignDto } from "./dto/get-participant-balance-for-campaign.dto";
import {
  TransactionCode,
  TransactionType,
} from "./entities/transaction-code.entity";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { GetHistoryQueryDto } from "./dto/get-history-query.dto";

@ApiTags("Participant Campaign Balance")
@ApiBearerAuth()
@Controller("participant-campaign-balance")
export class ParticipantCampaignBalanceController {
  constructor(
    private readonly redemptionService: RedemptionService,
    private readonly pointEarningService: PointEarningService,
    private readonly participantCampaignBalanceService: ParticipantCampaignBalanceService,
    private readonly transactionCodeService: TransactionCodeService,
  ) {}

  @Get("my-balance")
  @ApiOperation({
    summary: "Get the current participant`s point balance",
    description:
      "Allows a participant to view their global point balance and their balance for each campaign. Accessible only by the Participant role.",
  })
  @ApiResponse({
    status: 200,
    description: "The participant`s point balance.",
    type: GetParticipantBalanceDto,
  })
  @ApiResponse({ status: 404, description: "Not Found." })
  @Roles(Role.Participant)
  getParticipantBalance(@CurrentUser() user: User) {
    return this.participantCampaignBalanceService.getParticipantBalance(
      user.id,
    );
  }

  @Get("my-balance/:campaignId")
  @ApiOperation({
    summary:
      "Get the current participant`s point balance for a specific campaign",
    description:
      "Allows a participant to view their point balance for a specific campaign. Accessible only by the Participant role.",
  })
  @ApiResponse({
    status: 200,
    description: "The participant`s point balance for the specified campaign.",
    type: GetParticipantBalanceForCampaignDto,
  })
  @ApiResponse({ status: 404, description: "Not Found." })
  @Roles(Role.Participant)
  getParticipantBalanceForCampaign(
    @CurrentUser() user: User,
    @Param("campaignId") campaignId: string,
  ) {
    return this.participantCampaignBalanceService.getParticipantBalanceForCampaign(
      user.id,
      campaignId,
    );
  }

  @Get("is-joined")
  @ApiOperation({
    summary: "Check if participant has joined a campaign",
    description:
      "Checks if the authenticated participant is part of the specified campaign.",
  })
  @ApiQuery({ type: IsJoinedDto })
  @ApiResponse({
    status: 200,
    description: "Returns whether the participant has joined.",
    schema: {
      type: "object",
      properties: {
        isJoined: { type: "boolean" },
      },
    },
  })
  @Roles(Role.Participant)
  async isJoined(@CurrentUser() user: User, @Query() dto: IsJoinedDto) {
    return this.participantCampaignBalanceService.isJoined(
      user.id,
      dto.campaignId,
    );
  }

  @Get("history")
  @ApiOperation({
    summary: "Get all transaction history for the participant",
    description:
      "Returns a paginated list of all point transactions across all campaigns.",
  })
  @ApiQuery({ type: GetHistoryQueryDto })
  @ApiResponse({
    status: 200,
    description: "Returns transaction history.",
  })
  @Roles(Role.Participant)
  async getAllHistory(
    @CurrentUser() user: User,
    @Query() query: GetHistoryQueryDto,
  ) {
    return this.participantCampaignBalanceService.getAllHistory(user.id, query);
  }

  @Get("history/:campaignId")
  @ApiOperation({
    summary: "Get transaction history for a specific campaign",
    description:
      "Returns a paginated list of point transactions for a specific campaign.",
  })
  @ApiQuery({ type: GetHistoryQueryDto })
  @ApiResponse({
    status: 200,
    description: "Returns transaction history for the campaign.",
  })
  @ApiResponse({
    status: 400,
    description: "Participant is not participating in this campaign.",
  })
  @Roles(Role.Participant)
  async getHistoryForCampaign(
    @CurrentUser() user: User,
    @Param("campaignId") campaignId: string,
    @Query() query: GetHistoryQueryDto,
  ) {
    return this.participantCampaignBalanceService.getHistoryForCampaign(
      user.id,
      campaignId,
      query,
    );
  }

  @Post("award-points")
  @ApiOperation({
    summary: "Award points to a participant",
    description:
      "Allows a staff member to award points to a participant for a specific campaign. Accessible by Admin, Business, and Staff roles.",
  })
  @ApiBody({ type: AwardPointsDto })
  @ApiResponse({
    status: 201,
    description: "The points have been successfully awarded.",
    type: ParticipantCampaignBalance,
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 404, description: "Not Found." })
  @Roles(Role.Admin, Role.Business, Role.Staff)
  awardPoints(@Body() awardPointsDto: AwardPointsDto) {
    return this.pointEarningService.awardPoints(
      awardPointsDto.staffId,
      "Staff",
      awardPointsDto.participantId,
      awardPointsDto.campaignId,
      awardPointsDto.points,
      undefined,
      undefined,
      awardPointsDto.idempotencyKey,
    );
  }

  @Post("award-stamps")
  @ApiOperation({
    summary: "Award stamps to a participant",
    description:
      "Allows a staff member to award stamps to a participant for a specific campaign. Accessible by Admin, Business, and Staff roles.",
  })
  @ApiBody({ type: AwardStampsDto })
  @ApiResponse({
    status: 201,
    description: "The stamps have been successfully awarded.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 404, description: "Not Found." })
  @Roles(Role.Admin, Role.Business, Role.Staff)
  awardStamps(@Body() awardStampsDto: AwardStampsDto) {
    return this.pointEarningService.awardStamps(
      awardStampsDto.staffId,
      "Staff",
      awardStampsDto.participantId,
      awardStampsDto.campaignId,
      awardStampsDto.stamps || 1,
    );
  }

  @Post("redeem-reward")
  @ApiOperation({
    summary: "Redeem a reward for a participant",
    description:
      "Allows a staff member to process a reward redemption for a participant. Accessible by Admin, Business, and Staff roles.",
  })
  @ApiBody({ type: RedeemRewardDto })
  @ApiResponse({
    status: 201,
    description: "The reward has been successfully redeemed.",
    type: ParticipantCampaignBalance,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request. For example, not enough points.",
  })
  @ApiResponse({ status: 404, description: "Not Found." })
  @Roles(Role.Admin, Role.Business, Role.Staff)
  redeemReward(@Body() redeemRewardDto: RedeemRewardDto) {
    return this.redemptionService.redeemReward(
      redeemRewardDto.staffId,
      "Staff",
      redeemRewardDto.participantId,
      redeemRewardDto.rewardId,
      redeemRewardDto.campaignId,
      redeemRewardDto.redemptionCode,
      "Redeemed via direct input",
      redeemRewardDto.redemptionMethod || "points",
    );
  }

  @Post("redeem-self")
  @ApiOperation({
    summary: "Participant redempts a reward for themselves",
    description:
      "Allows a participant to redeem a reward directly (e.g., for digital vouchers).",
  })
  @ApiBody({ type: RedeemRewardSelfDto })
  @ApiResponse({
    status: 201,
    description: "The reward has been successfully redeemed.",
    type: ParticipantCampaignBalance,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request. For example, not enough points.",
  })
  @Roles(Role.Participant)
  redeemSelf(@CurrentUser() user: User, @Body() dto: RedeemRewardSelfDto) {
    return this.redemptionService.redeemReward(
      user.id,
      "Participant",
      user.id,
      dto.rewardId,
      dto.campaignId,
      null,
      "Self Redemption",
    );
  }

  // Method A: Scan Participant
  @Post("scan-participant")
  @ApiOperation({
    summary:
      "Method A: Staff/Business scans Participant to Award Points or Redeem Reward",
  })
  @ApiBody({ type: ScanParticipantDto })
  @Roles(Role.Business, Role.Staff)
  async scanParticipant(
    @CurrentUser() user: User,
    @Body() dto: ScanParticipantDto,
  ) {
    const performerType = user.role === Role.Staff ? "Staff" : "Business";

    if (dto.type === TransactionType.EARN) {
      if (!dto.points)
        throw new BadRequestException("Points are required for EARN type");
      return this.pointEarningService.awardPointsByScan(
        user.id,
        performerType,
        dto.participantCode,
        dto.campaignId,
        dto.points,
        dto.idempotencyKey,
      );
    } else if (dto.type === TransactionType.STAMP_EARN) {
      return this.pointEarningService.awardStampsByScan(
        user.id,
        performerType,
        dto.participantCode,
        dto.campaignId,
        dto.stamps,
        dto.idempotencyKey,
      );
    } else {
      if (!dto.rewardId)
        throw new BadRequestException("Reward ID is required for REDEEM type");
      return this.redemptionService.redeemRewardByScan(
        user.id,
        performerType,
        dto.participantCode,
        dto.rewardId,
        dto.campaignId,
        dto.redemptionCode,
        dto.redemptionMethod,
        dto.idempotencyKey,
      );
    }
  }

  // Method B: Generate Code
  @Post("generate-code")
  @ApiOperation({
    summary:
      "Method B: Staff/Business generates a code for Participant to claim",
  })
  @ApiBody({ type: GenerateCodeDto })
  @Roles(Role.Business, Role.Staff)
  async generateCode(@CurrentUser() user: User, @Body() dto: GenerateCodeDto) {
    return this.transactionCodeService.generateCode(dto, user);
  }

  // Method B: Claim Code
  @Post("claim-code")
  @ApiOperation({
    summary: "Method B: Participant claims a generated code",
  })
  @ApiBody({ type: ClaimCodeDto })
  @Roles(Role.Participant)
  async claimCode(@CurrentUser() user: User, @Body() dto: ClaimCodeDto) {
    // Use the service method that handles the transaction
    return this.participantCampaignBalanceService.claimCode(
      user.id,
      dto.code,
      dto.campaignId,
    );
  }

  // Method C: Dual Scan
  @Post("dual-scan")
  @ApiOperation({
    summary:
      "Method C: Authenticated Staff/Business sends their own code and Participant code",
  })
  @ApiBody({ type: DualScanDto })
  @Roles(Role.Business, Role.Staff)
  async dualScan(@CurrentUser() user: User, @Body() dto: DualScanDto) {
    // Security Check: Ensure the code belongs to the authenticated user or their business
    await this.transactionCodeService.validateDualScanPermission(
      user,
      dto.staffOrBusinessCode,
    );

    if (dto.type === TransactionType.EARN) {
      if (!dto.points)
        throw new BadRequestException("Points are required for EARN type");
      return this.pointEarningService.awardPointsDualScan(
        dto.staffOrBusinessCode,
        dto.participantCode,
        dto.campaignId,
        dto.points,
      );
    } else if (dto.type === TransactionType.STAMP_EARN) {
      return this.pointEarningService.awardStampsDualScan(
        dto.staffOrBusinessCode,
        dto.participantCode,
        dto.campaignId,
        dto.stamps,
      );
    } else {
      if (!dto.rewardId)
        throw new BadRequestException("Reward ID is required for REDEEM type");
      return this.redemptionService.redeemRewardDualScan(
        dto.staffOrBusinessCode,
        dto.participantCode,
        dto.rewardId,
        dto.campaignId,
        dto.redemptionCode,
        dto.redemptionMethod || "points",
      );
    }
  }

  @Get("codes/generated")
  @ApiOperation({
    summary: "Get list of codes generated by the current user",
  })
  @ApiQuery({ type: PaginationDto })
  @Roles(Role.Business, Role.Staff)
  async getGeneratedCodes(
    @CurrentUser() user: User,
    @Query() query: PaginationDto,
  ) {
    return this.transactionCodeService.getGeneratedCodes(
      user,
      query.page || 1,
      query.limit || 10,
    );
  }
}
