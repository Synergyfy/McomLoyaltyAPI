import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SetupService } from "./setup.service";
import { SetupController } from "./setup.controller";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { Staff } from "../staff/entities/staff.entity";
import { Tier } from "../tier/entities/tier.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { PointPackage } from "../point-package/entities/point-package.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessReward,
      BusinessCampaign,
      Staff,
      Tier,
      Reward,
      Campaign,
      PointPackage,
    ]),
  ],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
