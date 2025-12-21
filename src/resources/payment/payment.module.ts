import { Module, forwardRef } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tier } from "../tier/entities/tier.entity";
import { Membership } from "../membership/entities/membership.entity";
import { PaymentHistory } from "../payment-history/entities/payment-history.entity";
import { StripeService } from "./stripe.service";
import { PaypalService } from "./paypal.service";
import { ConfigModule } from "@nestjs/config";
import { CouponModule } from "../coupon/coupon.module";
import { Business } from "../business/entities/business.entity";
import { QrPlaquesModule } from "../qr-plaques/qr-plaques.module";
import { AuthModule } from "../../auth/auth.module";
import { UserModule } from "../../user/user.module";

import { PointPackage } from "../point-package/entities/point-package.entity";
import { BusinessPointPackage } from "../point-package/entities/business-point-package.entity";
import { StampPackage } from "../stamp/entities/stamp-package.entity";
import { BusinessStampPackage } from "../stamp/entities/business-stamp-package.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tier,
      Membership,
      PaymentHistory,
      Business,
      PointPackage,
      BusinessPointPackage,
      StampPackage,
      BusinessStampPackage,
    ]),
    ConfigModule,
    CouponModule,
    QrPlaquesModule,
    forwardRef(() => AuthModule),
    UserModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, PaypalService],
  exports: [PaymentService, StripeService, PaypalService],
})
export class PaymentModule {}
