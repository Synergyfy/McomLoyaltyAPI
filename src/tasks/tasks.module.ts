
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../resources/membership/entities/membership.entity';
import { Business } from '../resources/business/entities/business.entity';
import { StripeService } from '../resources/payment/stripe.service';
import { PaymentService } from '../resources/payment/payment.service';
import { Tier } from '../resources/tier/entities/tier.entity';
import { PaymentHistory } from '../resources/payment-history/entities/payment-history.entity';
import { CouponModule } from '../resources/coupon/coupon.module';
import { PaypalService } from '../resources/payment/paypal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership, Business, Tier, PaymentHistory]),
    CouponModule,
  ],
  providers: [TasksService, StripeService, PaymentService, PaypalService],
})
export class TasksModule {}
