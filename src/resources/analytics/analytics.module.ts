import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Business } from "../business/entities/business.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { Participant } from "../participant/entities/participant.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

import { AdminAnalyticsController } from "./controllers/admin.analytics.controller";
import { AdminAnalyticsService } from "./services/admin.analytics.service";

import { PointHistoryService } from "./services/point-history.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Campaign,
      Participant,
      PointHistory,
      Reward,
      BusinessCampaign,
      ParticipantCampaignBalance,
    ]),
  ],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService, AdminAnalyticsService, PointHistoryService],
  exports: [PointHistoryService],
})
export class AnalyticsModule {}
