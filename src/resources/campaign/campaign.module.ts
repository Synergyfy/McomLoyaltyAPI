import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Business, Reward])],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}