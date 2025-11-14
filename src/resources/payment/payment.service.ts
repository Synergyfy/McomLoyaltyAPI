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
import { Coupon } from '../coupon/entities/coupon.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
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
      await this._createOrUpdateMembership(
        user,
        tier,
        paymentIntent.metadata.plan_type as PlanType,
        paymentIntent.amount / 100,
        PaymentProvider.STRIPE,
        paymentIntent.id,
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
      await this._createOrUpdateMembership(
        user,
        tier,
        capture.result.purchaseUnits[0].description as PlanType,
        parseFloat(capture.result.purchaseUnits[0].amount.value),
        PaymentProvider.PAYPAL,
        capture.result.id,
      );
    }
    return { status: capture.result.status };
  }

  private async _calculateAmount(tier: Tier, planType: PlanType, couponCode?: string): Promise<number> {
    let amount = planType === PlanType.ANNUAL ? tier.annual_price : tier.monthly_price;
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
  ) {
    let membership = await this.membershipRepository.findOne({ where: { user_id: user.id } });
    const startsAt = new Date();
    const expiresAt = new Date();
    if (planType === PlanType.ANNUAL) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    if (membership) {
      membership.tier = tier;
      membership.plan_type = planType;
      membership.starts_at = startsAt;
      membership.expires_at = expiresAt;
      membership.status = MembershipStatus.ACTIVE;
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
      });
      await this.membershipRepository.save(membership);
    }

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
