import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeederService } from "./seeder.service";
import { Admin } from "../resources/admin/entities/admin.entity";
import { Business } from "../resources/business/entities/business.entity";
import { Campaign } from "../resources/campaign/entities/campaign.entity";
import { BusinessCampaign } from "../resources/campaign/entities/business-campaign.entity";
import { Category } from "../resources/category/entities/category.entity";
import { Deal } from "../resources/deal/entities/deal.entity";
import { Otp } from "../resources/otp/entities/otp.entity";
import { Participant } from "../resources/participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../resources/participant-campaign-balance/entities/participant-campaign-balance.entity";
import { PointHistory } from "../resources/participant-campaign-balance/entities/point-history.entity";
import { Referral } from "../resources/referral/entities/referral.entity";
import { Reward } from "../resources/rewards/entities/reward.entity";
import { BusinessReward } from "../resources/rewards/entities/business-reward.entity";
import { Sector } from "../resources/sector/entities/sector.entity";
import { Staff } from "../resources/staff/entities/staff.entity";
import { SubCategory } from "../resources/subcategory/entities/subcategory.entity";
import { Partner } from "../resources/partner/entities/partner.entity";
import { QrPlaque } from "../resources/qr-plaques/entities/qr-plaque.entity";
import { Membership } from "../resources/membership/entities/membership.entity";
import { Tier } from "../resources/tier/entities/tier.entity";
import { Coupon } from "../resources/coupon/entities/coupon.entity";
import { PaymentHistory } from "../resources/payment-history/entities/payment-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Business,
      Campaign,
      BusinessCampaign,
      Category,
      Deal,
      Otp,
      Participant,
      ParticipantCampaignBalance,
      PointHistory,
      Referral,
      Reward,
      BusinessReward,
      Sector,
      Staff,
      SubCategory,
      Partner,
      QrPlaque,
      Membership,
      Tier,
      Coupon,
      PaymentHistory,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
