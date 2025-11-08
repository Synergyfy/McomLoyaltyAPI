import { Controller, Post, Body, Param } from '@nestjs/common';
import { RedemptionService } from './services/redemption.service';
import { PointEarningService } from './services/point-earning.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';

@Controller('participant-campaign-balance')
export class ParticipantCampaignBalanceController {
  constructor(
    private readonly redemptionService: RedemptionService,
    private readonly pointEarningService: PointEarningService,
  ) {}

  @Post('award-points')
  awardPoints(@Body() awardPointsDto: AwardPointsDto) {
    return this.pointEarningService.awardPoints(
      awardPointsDto.staffId,
      awardPointsDto.participantId,
      awardPointsDto.campaignId,
      awardPointsDto.points,
    );
  }

  @Post('redeem-reward')
  redeemReward(@Body() redeemRewardDto: RedeemRewardDto) {
    return this.redemptionService.redeemReward(
      redeemRewardDto.staffId,
      redeemRewardDto.participantId,
      redeemRewardDto.rewardId,
      redeemRewardDto.redemptionCode,
    );
  }
}