import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from '../tier/entities/tier.entity';
import { Membership } from '../membership/entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { ConfigModule } from '@nestjs/config';
import { CouponModule } from '../coupon/coupon.module';
import { Business } from '../business/entities/business.entity';
import { QrPlaquesModule } from '../qr-plaques/qr-plaques.module';

import { PointPackage } from '../point-package/entities/point-package.entity';
import { BusinessPointPackage } from '../point-package/entities/business-point-package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tier, Membership, PaymentHistory, Business, PointPackage, BusinessPointPackage]),
    ConfigModule,
    CouponModule,
    QrPlaquesModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, PaypalService],
  exports: [PaymentService],
})
export class PaymentModule { }
