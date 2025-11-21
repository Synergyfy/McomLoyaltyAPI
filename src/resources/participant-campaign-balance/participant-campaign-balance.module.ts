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
import { ParticipantCampaignBalanceService } from './services/participant-campaign-balance.service';
import { TransactionCode } from './entities/transaction-code.entity';
import { Business } from '../business/entities/business.entity';
import { TransactionCodeService } from './services/transaction-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipantCampaignBalance,
      PointHistory,
      Staff,
      Participant,
      BusinessReward,
      Campaign,
      TransactionCode,
      Business,
    ]),
  ],
  providers: [
    RedemptionService,
    PointEarningService,
    ParticipantCampaignBalanceService,
    TransactionCodeService,
  ],
  controllers: [ParticipantCampaignBalanceController],
})
export class ParticipantCampaignBalanceModule {}