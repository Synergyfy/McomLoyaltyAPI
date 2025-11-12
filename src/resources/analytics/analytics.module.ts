import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Business } from '../business/entities/business.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Participant } from '../participant/entities/participant.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Reward } from '../reward/entities/reward.entity';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { AdminAnalyticsController } from './controllers/admin.analytics.controller';
import { AdminAnalyticsService } from './services/admin.analytics.service';

import { PointHistoryService } from './services/point-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Campaign,
      Participant,
      PointHistory,
      Reward,
    ]),
  ],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService, AdminAnalyticsService, PointHistoryService],
})
export class AnalyticsModule {}
