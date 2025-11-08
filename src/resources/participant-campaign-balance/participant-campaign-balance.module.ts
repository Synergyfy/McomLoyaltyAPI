import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantCampaignBalance } from './entities/participant-campaign-balance.entity';
import { PointHistory } from './entities/point-history.entity';
import { RedemptionService } from './services/redemption.service';
import { PointEarningService } from './services/point-earning.service';
import { ParticipantCampaignBalanceController } from './participant-campaign-balance.controller';
import { Staff } from '../staff/entities/staff.entity';
import { Participant } from '../participant/entities/participant.entity';
import { BusinessReward } from '../rewards/entities/business-reward.entity';
import { Campaign } from '../campaign/entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipantCampaignBalance,
      PointHistory,
      Staff,
      Participant,
      BusinessReward,
      Campaign,
    ]),
  ],
  providers: [RedemptionService, PointEarningService],
  controllers: [ParticipantCampaignBalanceController],
})
export class ParticipantCampaignBalanceModule {}