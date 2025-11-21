import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { RedemptionService } from './services/redemption.service';
import { PointEarningService } from './services/point-earning.service';
import { TransactionCodeService } from './services/transaction-code.service';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { ClaimCodeDto } from './dto/claim-code.dto';
import { ScanParticipantDto } from './dto/scan-participant.dto';
import { DualScanDto } from './dto/dual-scan.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParticipantCampaignBalance } from './entities/participant-campaign-balance.entity';
import { ParticipantCampaignBalanceService } from './services/participant-campaign-balance.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/interfaces/user.interface';
import { GetParticipantBalanceDto } from './dto/get-participant-balance.dto';
import { GetParticipantBalanceForCampaignDto } from './dto/get-participant-balance-for-campaign.dto';
import { TransactionCode, TransactionType } from './entities/transaction-code.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Participant Campaign Balance')
@ApiBearerAuth()
@Controller('participant-campaign-balance')
export class ParticipantCampaignBalanceController {
  constructor(
    private readonly redemptionService: RedemptionService,
    private readonly pointEarningService: PointEarningService,
    private readonly participantCampaignBalanceService: ParticipantCampaignBalanceService,
    private readonly transactionCodeService: TransactionCodeService,
  ) {}

  @Get('my-balance')
  @ApiOperation({
    summary: 'Get the current participant`s point balance',
    description:
      'Allows a participant to view their global point balance and their balance for each campaign. Accessible only by the Participant role.',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant`s point balance.',
    type: GetParticipantBalanceDto,
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @Roles(Role.Participant)
  getParticipantBalance(@CurrentUser() user: User) {
    return this.participantCampaignBalanceService.getParticipantBalance(user.id);
  }

  @Get('my-balance/:campaignId')
  @ApiOperation({
    summary: 'Get the current participant`s point balance for a specific campaign',
    description:
      'Allows a participant to view their point balance for a specific campaign. Accessible only by the Participant role.',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant`s point balance for the specified campaign.',
    type: GetParticipantBalanceForCampaignDto,
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @Roles(Role.Participant)
  getParticipantBalanceForCampaign(
    @CurrentUser() user: User,
    @Param('campaignId') campaignId: string,
  ) {
    return this.participantCampaignBalanceService.getParticipantBalanceForCampaign(
      user.id,
      campaignId,
    );
  }

  // Method A: Scan Participant
  @Post('scan-participant')
  @ApiOperation({
    summary: 'Method A: Staff/Business scans Participant to Award Points or Redeem Reward',
  })
  @ApiBody({ type: ScanParticipantDto })
  @Roles(Role.Business, Role.Staff)
  async scanParticipant(@CurrentUser() user: User, @Body() dto: ScanParticipantDto) {
    const performerType = user.role === Role.Staff ? 'Staff' : 'Business';

    if (dto.type === TransactionType.EARN) {
      if (!dto.points) throw new BadRequestException('Points are required for EARN type');
      return this.pointEarningService.awardPointsByScan(user.id, performerType, dto.participantCode, dto.campaignId, dto.points);
    } else {
      if (!dto.rewardId) throw new BadRequestException('Reward ID is required for REDEEM type');
      return this.redemptionService.redeemRewardByScan(user.id, performerType, dto.participantCode, dto.rewardId, null);
    }
  }

  // Method B: Generate Code
  @Post('generate-code')
  @ApiOperation({
    summary: 'Method B: Staff/Business generates a code for Participant to claim',
  })
  @ApiBody({ type: GenerateCodeDto })
  @Roles(Role.Business, Role.Staff)
  async generateCode(@CurrentUser() user: User, @Body() dto: GenerateCodeDto) {
    return this.transactionCodeService.generateCode(dto, user);
  }

  // Method B: Claim Code
  @Post('claim-code')
  @ApiOperation({
    summary: 'Method B: Participant claims a generated code',
  })
  @ApiBody({ type: ClaimCodeDto })
  @Roles(Role.Participant)
  async claimCode(@CurrentUser() user: User, @Body() dto: ClaimCodeDto) {
    // Use the service method that handles the transaction
    return this.participantCampaignBalanceService.claimCode(user.id, dto.code, dto.campaignId);
  }

  // Method C: Dual Scan
  @Post('dual-scan')
  @ApiOperation({
    summary: 'Method C: Authenticated Staff/Business sends their own code and Participant code',
  })
  @ApiBody({ type: DualScanDto })
  @Roles(Role.Business, Role.Staff)
  async dualScan(@CurrentUser() user: User, @Body() dto: DualScanDto) {
    // Security Check: Ensure the code belongs to the authenticated user or their business
    await this.transactionCodeService.validateDualScanPermission(user, dto.staffOrBusinessCode);

    if (dto.type === TransactionType.EARN) {
      if (!dto.points) throw new BadRequestException('Points are required for EARN type');
      return this.pointEarningService.awardPointsDualScan(dto.staffOrBusinessCode, dto.participantCode, dto.campaignId, dto.points);
    } else {
      if (!dto.rewardId) throw new BadRequestException('Reward ID is required for REDEEM type');
      return this.redemptionService.redeemRewardDualScan(dto.staffOrBusinessCode, dto.participantCode, dto.rewardId, null);
    }
  }

  @Get('codes/generated')
  @ApiOperation({
    summary: 'Get list of codes generated by the current user',
  })
  @ApiQuery({ type: PaginationDto })
  @Roles(Role.Business, Role.Staff)
  async getGeneratedCodes(@CurrentUser() user: User, @Query() query: PaginationDto) {
    return this.transactionCodeService.getGeneratedCodes(user, query.page || 1, query.limit || 10);
  }
}
