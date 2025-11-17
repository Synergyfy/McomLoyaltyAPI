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

@Module({
  imports: [
    TypeOrmModule.forFeature([Tier, Membership, PaymentHistory, Business]),
    ConfigModule,
    CouponModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, PaypalService],
})
export class PaymentModule {}
