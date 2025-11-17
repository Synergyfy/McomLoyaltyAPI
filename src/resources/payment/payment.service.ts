import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tier } from '../tier/entities/tier.entity';
import { Membership, MembershipStatus, PlanType } from '../membership/entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { PaymentProvider, PaymentStatus } from '../payment-history/entities/payment-history.entity';
import { CouponService } from '../coupon/coupon.service';
import { Business } from '../business/entities/business.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly stripeService: StripeService,
    private readonly paypalService: PaypalService,
    private readonly couponService: CouponService,
  ) {}

  async initiateStripePayment(initiatePaymentDto: InitiatePaymentDto, user: any) {
    const tier = await this.tierRepository.findOne({ where: { id: initiatePaymentDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }
    const amount = await this._calculateAmount(tier, initiatePaymentDto.plan_type, initiatePaymentDto.coupon_code);
    const paymentIntent = await this.stripeService.createPaymentIntent(amount * 100, 'gbp', {
      tier_id: tier.id,
      plan_type: initiatePaymentDto.plan_type,
    });
    return { clientSecret: paymentIntent.client_secret };
  }

  async verifyStripePayment(verifyPaymentDto: VerifyPaymentDto, user: any) {
    const paymentIntent = await this.stripeService.verifyPayment(verifyPaymentDto.transaction_id);
    if (paymentIntent.status === 'succeeded') {
      const tier = await this.tierRepository.findOne({ where: { id: paymentIntent.metadata.tier_id } });
      const expiresAt = new Date();
      const planType = paymentIntent.metadata.plan_type as PlanType;
      if (planType === PlanType.ANNUAL) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (planType === PlanType.QUARTERLY) {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await this._createOrUpdateMembership(
        user,
        tier,
        planType,
        paymentIntent.amount / 100,
        PaymentProvider.STRIPE,
        paymentIntent.id,
        false,
        expiresAt,
      );
    }
    return { status: paymentIntent.status };
  }

  async initiatePaypalPayment(initiatePaymentDto: InitiatePaymentDto, user: any) {
    const tier = await this.tierRepository.findOne({ where: { id: initiatePaymentDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }
    const amount = await this._calculateAmount(tier, initiatePaymentDto.plan_type, initiatePaymentDto.coupon_code);
    const order = await this.paypalService.createOrder(amount, 'GBP', tier.id, initiatePaymentDto.plan_type);
    return { orderId: order.result.id };
  }

  async verifyPaypalPayment(verifyPaymentDto: VerifyPaymentDto, user: any) {
    const capture = await this.paypalService.capturePayment(verifyPaymentDto.transaction_id);
    if (capture.result.status === 'COMPLETED') {
      const tier = await this.tierRepository.findOne({ where: { id: capture.result.purchaseUnits[0].referenceId } });
      const expiresAt = new Date();
      const planType = capture.result.purchaseUnits[0].description as PlanType;
      if (planType === PlanType.ANNUAL) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (planType === PlanType.QUARTERLY) {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await this._createOrUpdateMembership(
        user,
        tier,
        planType,
        parseFloat(capture.result.purchaseUnits[0].amount.value),
        PaymentProvider.PAYPAL,
        capture.result.id,
        false,
        expiresAt,
      );
    }
    return { status: capture.result.status };
  }

  async subscribe(subscribeDto: SubscribeDto, business: Business) {
    const tier = await this.tierRepository.findOne({ where: { id: subscribeDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    let stripeCustomerId = business.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(business.name, business.email, subscribeDto.payment_token);
      stripeCustomerId = customer.id;
      await this.businessRepository.update(business.id, { stripe_customer_id: stripeCustomerId });
    }

    if (subscribeDto.is_trial) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14-day trial

      await this._createOrUpdateMembership(business, tier, subscribeDto.plan_type, 0, null, null, true, expiresAt);
      return { status: 'Trial started' };
    } else {
      const amount = this._calculateAmountForSubscription(tier, subscribeDto.plan_type);
      const charge = await this.stripeService.createCharge(amount * 100, 'gbp', stripeCustomerId, `Subscription to ${tier.name} (${subscribeDto.plan_type})`);

      if (charge.status === 'succeeded') {
        const expiresAt = new Date();
        if (subscribeDto.plan_type === PlanType.ANNUAL) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else if (subscribeDto.plan_type === PlanType.QUARTERLY) {
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await this._createOrUpdateMembership(business, tier, subscribeDto.plan_type, amount, PaymentProvider.STRIPE, charge.id, false, expiresAt);
        return { status: 'Subscription successful' };
      } else {
        throw new BadRequestException('Payment failed');
      }
    }
  }

  private _calculateAmountForSubscription(tier: Tier, planType: PlanType): number {
    if (planType === PlanType.ANNUAL) {
      return tier.annual_price;
    }
    if (planType === PlanType.QUARTERLY) {
      return tier.quaterly_price;
    }
    return tier.monthly_price;
  }

  private async _calculateAmount(tier: Tier, planType: PlanType, couponCode?: string): Promise<number> {
    let amount = this._calculateAmountForSubscription(tier, planType);
    if (couponCode) {
      const coupon = await this.couponService.findByCode(couponCode);
      if (coupon && coupon.is_active && new Date(coupon.expires_at) > new Date()) {
        if (coupon.discount_type === 'percentage') {
          amount -= (amount * coupon.discount_value) / 100;
        } else {
          amount -= coupon.discount_value;
        }
      } else {
        throw new BadRequestException('Invalid or expired coupon code');
      }
    }
    return amount > 0 ? amount : 0;
  }

  private async _createOrUpdateMembership(
    user: any,
    tier: Tier,
    planType: PlanType,
    amount: number,
    provider: PaymentProvider,
    transactionId: string,
    isTrial: boolean = false,
    expiresAt: Date,
  ) {
    let membership = await this.membershipRepository.findOne({ where: { user_id: user.id } });
    const startsAt = new Date();

    if (membership) {
      membership.tier = tier;
      membership.plan_type = planType;
      membership.starts_at = startsAt;
      membership.expires_at = expiresAt;
      membership.status = MembershipStatus.ACTIVE;
      membership.is_trial = isTrial;
      await this.membershipRepository.save(membership);
    } else {
      membership = this.membershipRepository.create({
        user_id: user.id,
        user_type: user.role,
        tier,
        plan_type: planType,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: MembershipStatus.ACTIVE,
        is_trial: isTrial,
      });
      await this.membershipRepository.save(membership);
    }

    if (!isTrial) {
      const paymentHistory = this.paymentHistoryRepository.create({
        user_id: user.id,
        user_type: user.role,
        membership,
        amount,
        payment_provider: provider,
        transaction_id: transactionId,
        status: PaymentStatus.SUCCEEDED,
      });
      await this.paymentHistoryRepository.save(paymentHistory);
    }
  }
}
