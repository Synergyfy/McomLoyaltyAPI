import { Module, forwardRef } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { CashbackController } from "./cashback.controller";
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
import { ReferralModule } from "../referral/referral.module";

import { PointPackage } from "../point-package/entities/point-package.entity";
import { BusinessPointPackage } from "../point-package/entities/business-point-package.entity";
import { StampPackage } from "../stamp/entities/stamp-package.entity";
import { BusinessStampPackage } from "../stamp/entities/business-stamp-package.entity";
import { WalletModule } from "../wallet/wallet.module";
import { CentralIntegrationService } from "./central-integration.service";

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
    WalletModule,
    ReferralModule,
  ],
  controllers: [PaymentController, CashbackController],
  providers: [
    PaymentService,
    StripeService,
    PaypalService,
    CentralIntegrationService,
  ],
  exports: [
    PaymentService,
    StripeService,
    PaypalService,
    CentralIntegrationService,
  ],
})
export class PaymentModule {}
