import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StampPackage } from "./entities/stamp-package.entity";
import { BusinessStampPackage } from "./entities/business-stamp-package.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Business } from "../business/entities/business.entity";
import { ParticipantCampaignBalanceModule } from "../participant-campaign-balance/participant-campaign-balance.module";
import { Staff } from "../staff/entities/staff.entity";
import { Tier } from "../tier/entities/tier.entity";
import { PaymentModule } from "../payment/payment.module";
import { StampPackageService } from "./services/stamp-package.service";
import { StampPackageController } from "./controllers/stamp-package.controller";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StampPackage,
      BusinessStampPackage,
      Participant,
      Business,
      Staff,
      Tier,
      PointHistory,
    ]),
    forwardRef(() => ParticipantCampaignBalanceModule),
    PaymentModule,
  ],
  controllers: [StampPackageController],
  providers: [StampPackageService],
  exports: [StampPackageService],
})
export class StampModule {}
