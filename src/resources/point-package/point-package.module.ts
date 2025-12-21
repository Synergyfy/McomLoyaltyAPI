import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointPackageService } from "./point-package.service";
import { PointPackageController } from "./point-package.controller";
import { PointPackage } from "./entities/point-package.entity";
import { BusinessPointPackage } from "./entities/business-point-package.entity";
import { Tier } from "../tier/entities/tier.entity";
import { MembershipModule } from "../membership/membership.module";

import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PointPackage, BusinessPointPackage, Tier]),
    MembershipModule,
    PaymentModule,
  ],
  controllers: [PointPackageController],
  providers: [PointPackageService],
  exports: [PointPackageService],
})
export class PointPackageModule {}
