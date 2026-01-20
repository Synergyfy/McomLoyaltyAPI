import { Module } from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";
import { BusinessCampaignController } from "./business-campaign.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Campaign } from "./entities/campaign.entity";
import { Business } from "../business/entities/business.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { Participant } from "../participant/entities/participant.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { Staff } from "../staff/entities/staff.entity";
import { WishlistAggregate } from "../wishlist/entities/wishlist-aggregate.entity";
import { WishlistItem } from "../wishlist/entities/wishlist-item.entity";
import { Tier } from "../tier/entities/tier.entity";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { MailModule } from "src/mail/mail.module";
import { CapabilityModule } from "../capability/capability.module";
import { forwardRef } from "@nestjs/common";
import { TierProgressionModule } from "../tier-progression/tier-progression.module";
import { Membership } from "../membership/entities/membership.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      Business,
      Reward,
      PointHistory,
      Participant,
      BusinessCampaign,
      BusinessReward,
      Staff,
      WishlistAggregate,
      WishlistItem,
      Tier,
      ParticipantCampaignBalance,
      Membership,
    ]),
    MailModule,
    forwardRef(() => CapabilityModule),
    forwardRef(() => TierProgressionModule),
  ],
  controllers: [CampaignController, BusinessCampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
