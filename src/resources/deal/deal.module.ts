import { Module } from "@nestjs/common";
import { DealService } from "./deal.service";
import { DealController } from "./deal.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Deal } from "./entities/deal.entity";
import { DealRedemption } from "./entities/deal-redemption.entity";
import { DealRedemptionService } from "./deal-redemption.service";
import { DealRedemptionController } from "./deal-redemption.controller";
import { CategoryModule } from "../category/category.module";
import { IsDateAfter } from "./validators/is-date-after.validator";
import { Campaign } from "../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { DealReview } from "./entities/deal-review.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { Participant } from "../participant/entities/participant.entity";
import { AuthModule } from "src/auth/auth.module";
import { ParticipantProgressionModule } from "../participant-progression/participant-progression.module";
import { DealAnalytics } from "./entities/deal-analytics.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      DealRedemption,
      Campaign,
      BusinessCampaign,
      DealReview,
      PointHistory,
      ParticipantCampaignBalance,
      Participant,
      DealAnalytics,
    ]),
    CategoryModule,
    AuthModule,
    ParticipantProgressionModule,
  ],
  controllers: [DealController, DealRedemptionController],
  providers: [DealService, DealRedemptionService, IsDateAfter],
})
export class DealModule {}
