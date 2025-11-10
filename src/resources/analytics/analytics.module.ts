import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../campaign/entities/campaign.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, PointHistory, Participant]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
