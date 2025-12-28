import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipantCampaignBalance } from "./entities/participant-campaign-balance.entity";
import { PointHistory } from "./entities/point-history.entity";
import { RedemptionService } from "./services/redemption.service";
import { PointEarningService } from "./services/point-earning.service";
import { ParticipantCampaignBalanceController } from "./participant-campaign-balance.controller";
import { Staff } from "../staff/entities/staff.entity";
import { Participant } from "../participant/entities/participant.entity";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { ParticipantCampaignBalanceService } from "./services/participant-campaign-balance.service";
import { TransactionCode } from "./entities/transaction-code.entity";
import { Business } from "../business/entities/business.entity";
import { TransactionCodeService } from "./services/transaction-code.service";
import { NotificationModule } from "../notification/notification.module";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { MailModule } from "../../mail/mail.module";
import { CapabilityModule } from "../capability/capability.module";
import { TierProgressionModule } from "../tier-progression/tier-progression.module";
import { MembershipModule } from "../membership/membership.module";
import { PointPackageModule } from "../point-package/point-package.module";
import { StampModule } from "../stamp/stamp.module";
import { WalletModule } from "../wallet/wallet.module";
import { MallIntegrationModule } from "../mall-integration/mall-integration.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipantCampaignBalance,
      PointHistory,
      Staff,
      Participant,
      BusinessReward,
      Campaign,
      BusinessCampaign,
      TransactionCode,
      Business,
    ]),
    MailModule,
    forwardRef(() => CapabilityModule),
    forwardRef(() => TierProgressionModule),
    MembershipModule,
    PointPackageModule,
    NotificationModule,
    forwardRef(() => StampModule),
    WalletModule,
    MallIntegrationModule,
  ],
  providers: [
    RedemptionService,
    PointEarningService,
    ParticipantCampaignBalanceService,
    TransactionCodeService,
  ],
  controllers: [ParticipantCampaignBalanceController],
})
export class ParticipantCampaignBalanceModule {}
