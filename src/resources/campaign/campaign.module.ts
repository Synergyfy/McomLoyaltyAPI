import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { BusinessReward } from '../rewards/entities/business-reward.entity';
import { BusinessCampaign } from './entities/business-campaign.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { BusinessCampaignController } from './business-campaign.controller';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      Business,
      Reward,
      BusinessReward,
      BusinessCampaign,
      PointHistory,
      Participant,
    ]),
    VoucherModule,
  ],
  controllers: [CampaignController, BusinessCampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
