import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TierModule } from '../tier/tier.module';
import { MembershipModule } from '../membership/membership.module';
import { PaymentHistoryModule } from '../payment-history/payment-history.module';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { ConfigModule } from '@nestjs/config';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [TierModule, MembershipModule, PaymentHistoryModule, ConfigModule, CouponModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, PaypalService],
})
export class PaymentModule {}
