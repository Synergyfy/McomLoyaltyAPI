import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { PointHistory } from '../point/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      Business,
      Reward,
      PointHistory,
      Participant,
    ]),
  ],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
