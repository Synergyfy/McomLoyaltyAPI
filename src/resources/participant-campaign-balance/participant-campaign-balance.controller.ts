import { Controller, Post, Body } from '@nestjs/common';
import { RedemptionService } from './services/redemption.service';
import { PointEarningService } from './services/point-earning.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParticipantCampaignBalance } from './entities/participant-campaign-balance.entity';

@ApiTags('Participant Campaign Balance')
@ApiBearerAuth()
@Controller('participant-campaign-balance')
export class ParticipantCampaignBalanceController {
  constructor(
    private readonly redemptionService: RedemptionService,
    private readonly pointEarningService: PointEarningService,
  ) {}

  @Post('award-points')
  @ApiOperation({
    summary: 'Award points to a participant',
    description:
      'Allows a staff member to award points to a participant for a specific campaign. Accessible by Admin, Business, and Staff roles.',
  })
  @ApiBody({ type: AwardPointsDto })
  @ApiResponse({
    status: 201,
    description: 'The points have been successfully awarded.',
    type: ParticipantCampaignBalance,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @Roles(Role.Admin, Role.Business, Role.Staff)
  awardPoints(@Body() awardPointsDto: AwardPointsDto) {
    return this.pointEarningService.awardPoints(
      awardPointsDto.staffId,
      awardPointsDto.participantId,
      awardPointsDto.campaignId,
      awardPointsDto.points,
    );
  }

  @Post('redeem-reward')
  @ApiOperation({
    summary: 'Redeem a reward for a participant',
    description:
      'Allows a staff member to process a reward redemption for a participant. Accessible by Admin, Business, and Staff roles.',
  })
  @ApiBody({ type: RedeemRewardDto })
  @ApiResponse({
    status: 201,
    description: 'The reward has been successfully redeemed.',
    type: ParticipantCampaignBalance,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. For example, not enough points.',
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @Roles(Role.Admin, Role.Business, Role.Staff)
  redeemReward(@Body() redeemRewardDto: RedeemRewardDto) {
    return this.redemptionService.redeemReward(
      redeemRewardDto.staffId,
      redeemRewardDto.participantId,
      redeemRewardDto.rewardId,
      redeemRewardDto.redemptionCode,
    );
  }
}
