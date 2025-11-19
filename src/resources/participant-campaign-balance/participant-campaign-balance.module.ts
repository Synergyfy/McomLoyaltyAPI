import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantCampaignBalance } from './entities/participant-campaign-balance.entity';
import { Participant } from 'src/resources/participant/entities/participant.entity';
import { PointEarningService } from './services/point-earning.service';
import { RedemptionService } from './services/redemption.service';
import { ParticipantCampaignBalanceService } from './services/participant-campaign-balance.service';
import { ParticipantCampaignBalanceController } from './participant-campaign-balance.controller';
import { Campaign } from 'src/resources/campaign/entities/campaign.entity';
import { Business } from 'src/resources/business/entities/business.entity';
import { Staff } from 'src/resources/staff/entities/staff.entity';
import { PointHistory } from './entities/point-history.entity';
import { Reward } from 'src/resources/rewards/entities/reward.entity';
import { BusinessReward } from 'src/resources/rewards/entities/business-reward.entity';
import { MatchingPointsService } from './services/matching-points.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      ParticipantCampaignBalance,
      Campaign,
      Business,
      Staff,
      PointHistory,
      Reward,
      BusinessReward,
    ]),
  ],
  controllers: [ParticipantCampaignBalanceController],
  providers: [
    PointEarningService,
    RedemptionService,
    ParticipantCampaignBalanceService,
    MatchingPointsService,
  ],
  exports: [ParticipantCampaignBalanceService],
})
export class ParticipantCampaignBalanceModule {}
