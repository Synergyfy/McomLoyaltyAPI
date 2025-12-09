import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
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
import { ConfigService } from '@nestjs/config';
import { QrPlaquesService } from '../qr-plaques/qr-plaques.service';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';
import { PointPackage } from '../point-package/entities/point-package.entity';
import { BusinessPointPackage } from '../point-package/entities/business-point-package.entity';
import { In } from 'typeorm';

import { MatchingPointService } from '../matching-point/services/matching-point.service';
import { MatchingPointActivityType } from '../matching-point/entities/matching-point-config.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

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
    private readonly configService: ConfigService,
    private readonly qrPlaquesService: QrPlaquesService,
    @InjectRepository(PointPackage)
    private readonly pointPackageRepository: Repository<PointPackage>,
    @InjectRepository(BusinessPointPackage)
    private readonly businessPointPackageRepository: Repository<BusinessPointPackage>,
    private readonly matchingPointService: MatchingPointService,
  ) { }

  async initiateStripePayment(initiatePaymentDto: InitiatePaymentDto, user: any) {
    const tier = await this.tierRepository.findOne({ where: { id: initiatePaymentDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }
    let amount = await this._calculateAmount(tier, initiatePaymentDto.plan_type, initiatePaymentDto.coupon_code);

    let packageIdsString = '';
    if (initiatePaymentDto.point_package_ids && initiatePaymentDto.point_package_ids.length > 0) {
      const packages = await this.pointPackageRepository.find({
        where: { id: In(initiatePaymentDto.point_package_ids), is_active: true }
      });

      if (packages.length !== initiatePaymentDto.point_package_ids.length) {
        throw new NotFoundException('One or more point packages not found or inactive');
      }

      // Check if packages are available for this tier
      for (const pkg of packages) {
        // This check might be heavy if tiers are not loaded. 
        // Ideally we should query with relations or builder.
        // But let's assume if they have the ID they saw it in the list. 
        // Strict check:
        const packageWithTiers = await this.pointPackageRepository.findOne({
          where: { id: pkg.id },
          relations: ['tiers']
        });
        if (!packageWithTiers.tiers.some(t => t.id === tier.id)) {
          throw new BadRequestException(`Package ${pkg.name} is not available for tier ${tier.name}`);
        }
        amount += Number(pkg.price);
      }
      packageIdsString = initiatePaymentDto.point_package_ids.join(',');
    }

    const metadata: any = {
      tier_id: tier.id,
      plan_type: initiatePaymentDto.plan_type,
    };

    if (packageIdsString) {
      metadata.point_package_ids = packageIdsString;
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(amount * 100, 'gbp', metadata);
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

      if (paymentIntent.metadata.point_package_ids) {
        const packageIds = paymentIntent.metadata.point_package_ids.split(',');
        await this._awardPackages(user.id, packageIds, paymentIntent.id);
      }
    }
    return { status: paymentIntent.status };
  }

  async initiatePaypalPayment(initiatePaymentDto: InitiatePaymentDto, user: any) {
    const tier = await this.tierRepository.findOne({ where: { id: initiatePaymentDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }
    let amount = await this._calculateAmount(tier, initiatePaymentDto.plan_type, initiatePaymentDto.coupon_code);

    let description = initiatePaymentDto.plan_type as string;

    if (initiatePaymentDto.point_package_ids && initiatePaymentDto.point_package_ids.length > 0) {
      const packages = await this.pointPackageRepository.find({
        where: { id: In(initiatePaymentDto.point_package_ids), is_active: true }
      });

      if (packages.length !== initiatePaymentDto.point_package_ids.length) {
        throw new NotFoundException('One or more point packages not found or inactive');
      }

      for (const pkg of packages) {
        const packageWithTiers = await this.pointPackageRepository.findOne({
          where: { id: pkg.id },
          relations: ['tiers']
        });
        if (!packageWithTiers.tiers.some(t => t.id === tier.id)) {
          throw new BadRequestException(`Package ${pkg.name} is not available for tier ${tier.name}`);
        }
        amount += Number(pkg.price);
      }
      // Format: PLAN_TYPE|PKG:id1,id2
      description += `|PKG:${initiatePaymentDto.point_package_ids.join(',')}`;
    }

    const order = await this.paypalService.createOrder(amount, 'GBP', tier.id, description);
    return { orderId: order.result.id };
  }

  async verifyPaypalPayment(verifyPaymentDto: VerifyPaymentDto, user: any) {
    const capture = await this.paypalService.capturePayment(verifyPaymentDto.transaction_id);
    const result = capture.result as any;

    this.logger.debug(`PayPal Capture Result: ${JSON.stringify(result)}`);

    if (result.status === 'COMPLETED') {
      const purchaseUnits = result.purchaseUnits || result.purchase_units;

      if (!purchaseUnits || purchaseUnits.length === 0) {
        this.logger.error('PayPal capture result missing purchase_units');
        throw new BadRequestException('Invalid PayPal response: missing purchase information');
      }

      const purchaseUnit = purchaseUnits[0];
      const tierId = purchaseUnit.referenceId || purchaseUnit.reference_id;

      if (!tierId) {
        this.logger.error('PayPal capture result missing reference_id');
        throw new BadRequestException('Invalid PayPal response: missing tier information');
      }

      const tier = await this.tierRepository.findOne({ where: { id: tierId } });
      if (!tier) {
        throw new NotFoundException(`Tier with ID ${tierId} not found`);
      }

      // Description format: PLAN_TYPE or PLAN_TYPE|PKG:id1,id2
      const fullDescription = purchaseUnit.description as string;
      const [planTypeStr, pkgPart] = fullDescription.split('|PKG:');
      const planType = planTypeStr as PlanType;

      let amountValue: string | undefined;
      if (purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures.length > 0) {
        amountValue = purchaseUnit.payments.captures[0].amount?.value;
      } else if (purchaseUnit.amount) {
        amountValue = purchaseUnit.amount.value;
      }

      if (!amountValue) {
        this.logger.error('PayPal capture result missing amount value', result);
        throw new BadRequestException('Invalid PayPal response: missing amount');
      }

      const expiresAt = new Date();
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
        parseFloat(amountValue),
        PaymentProvider.PAYPAL,
        result.id,
        false,
        expiresAt,
      );

      if (pkgPart) {
        const packageIds = pkgPart.split(',');
        await this._awardPackages(user.id, packageIds, result.id);
      }
    }
    return { status: result.status };
  }

  async verifyPaypalSubscription(verifySubscriptionDto: VerifySubscriptionDto, user: any) {
    const subscriptionId = verifySubscriptionDto.subscription_id;
    const subscription = await this.paypalService.getSubscription(subscriptionId);

    // Check status - 'ACTIVE' is the standard active status for PayPal subscriptions
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVAL_PENDING') {
      // Depending on flow, APPROVAL_PENDING might mean user just returned from PayPal but it's not yet processed fully?
      // Usually after return_url, it should be ACTIVE if auto-approved, or we might need to activate it?
      // If User Action is SUBSCRIBE_NOW, it should be active upon return.
      // Let's assume ACTIVE is required.
      if (subscription.status !== 'ACTIVE') {
        throw new BadRequestException(`Subscription status is ${subscription.status}`);
      }
    }

    if (subscription.status === 'ACTIVE') {
      // We need to find which tier this plan corresponds to.
      const planId = subscription.plan_id;
      // Inefficient but robust: Find tier by any of the plan IDs
      const tier = await this.tierRepository.findOne({
        where: [
          { paypal_monthly_plan_id: planId },
          { paypal_quarterly_plan_id: planId },
          { paypal_annual_plan_id: planId }
        ]
      });

      if (!tier) {
        throw new NotFoundException('Tier matching this subscription plan not found');
      }

      // Determine PlanType
      let planType: PlanType;
      if (tier.paypal_monthly_plan_id === planId) planType = PlanType.MONTHLY;
      else if (tier.paypal_quarterly_plan_id === planId) planType = PlanType.QUARTERLY;
      else if (tier.paypal_annual_plan_id === planId) planType = PlanType.ANNUAL;
      else throw new BadRequestException('Plan type mismatch');

      // Calculate expiration
      // If next_billing_time is available, use it. Otherwise calculate based on planType.
      let expiresAt: Date;
      if (subscription.billing_info && subscription.billing_info.next_billing_time) {
        expiresAt = new Date(subscription.billing_info.next_billing_time);
      } else {
        expiresAt = new Date();
        if (planType === PlanType.ANNUAL) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else if (planType === PlanType.QUARTERLY) expiresAt.setMonth(expiresAt.getMonth() + 3);
        else expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // For amount, we can try to get it from subscription details or tier price
      // subscription.billing_info.last_payment.amount.value might exist if paid
      // Or just use tier price as fallback
      let amount = 0;
      if (subscription.billing_info?.last_payment?.amount?.value) {
        amount = parseFloat(subscription.billing_info.last_payment.amount.value);
      } else {
        amount = this._calculateAmountForSubscription(tier, planType);
      }

      await this._createOrUpdateMembership(
        user,
        tier,
        planType,
        amount,
        PaymentProvider.PAYPAL,
        subscriptionId,
        false,
        expiresAt
      );
    }

    return { status: subscription.status };
  }

  async subscribe(subscribeDto: SubscribeDto, business: Business) {
    const tier = await this.tierRepository.findOne({ where: { id: subscribeDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (subscribeDto.provider === PaymentProvider.PAYPAL) {
      const planId = this._getPaypalPlanIdForPlan(tier, subscribeDto.plan_type);
      if (!planId) {
        throw new BadRequestException('Invalid plan type or PayPal plan not configured for this tier');
      }
      if (!subscribeDto.return_url || !subscribeDto.cancel_url) {
        throw new BadRequestException('Return URL and Cancel URL are required for PayPal subscriptions');
      }

      // Create PayPal Subscription
      const subscription = await this.paypalService.createSubscription(
        planId,
        subscribeDto.return_url,
        subscribeDto.cancel_url
      );

      return {
        status: 'Subscription initiated',
        subscriptionId: subscription.subscriptionId,
        approvalUrl: subscription.approvalUrl
      };
    } else {
      // Default to Stripe
      let stripeCustomerId = business.stripe_customer_id;
      if (!stripeCustomerId) {
        if (!subscribeDto.payment_token) {
          throw new BadRequestException('Payment token required for Stripe subscription');
        }
        const customer = await this.stripeService.createCustomer(business.name, business.email, subscribeDto.payment_token);
        stripeCustomerId = customer.id;
        await this.businessRepository.update(business.id, { stripe_customer_id: stripeCustomerId });
      }

      const priceId = this._getPriceIdForPlan(tier, subscribeDto.plan_type);
      if (!priceId) {
        throw new BadRequestException('Invalid plan type for this tier');
      }

      const trialPeriodDays = subscribeDto.is_trial ? (subscribeDto.trial_days || 14) : undefined;

      const subscription = await this.stripeService.createSubscription(stripeCustomerId, priceId, trialPeriodDays);

      return {
        status: subscribeDto.is_trial ? 'Trial started' : 'Subscription successful',
        subscriptionId: subscription.id,
        clientSecret: (subscription as any).latest_invoice?.payment_intent?.client_secret
      };
    }
  }

  private _getPriceIdForPlan(tier: Tier, planType: PlanType): string | null {
    if (planType === PlanType.MONTHLY) {
      return tier.stripe_monthly_price_id;
    }
    if (planType === PlanType.QUARTERLY) {
      return tier.stripe_quarterly_price_id;
    }
    if (planType === PlanType.ANNUAL) {
      return tier.stripe_annual_price_id;
    }
    return null;
  }

  private _getPaypalPlanIdForPlan(tier: Tier, planType: PlanType): string | null {
    if (planType === PlanType.MONTHLY) {
      return tier.paypal_monthly_plan_id;
    }
    if (planType === PlanType.QUARTERLY) {
      return tier.paypal_quarterly_plan_id;
    }
    if (planType === PlanType.ANNUAL) {
      return tier.paypal_annual_plan_id;
    }
    return null;
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
    let membership = await this.membershipRepository.findOne({ where: { business: { id: user.id } } });
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
        business: { id: user.id } as Business,
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
        user: { id: user.id } as Business,
        user_type: user.role,
        membership,
        amount,
        payment_provider: provider,
        transaction_id: transactionId,
        status: PaymentStatus.SUCCEEDED,
      });
      await this.paymentHistoryRepository.save(paymentHistory);

      // Generate QR Plaques if applicable
      if (tier.qrCodeCount > 0 && user.role === 'business') {
        const business = await this.businessRepository.findOne({ where: { id: user.id } });
        if (business) {
          await this.qrPlaquesService.ensurePlaqueCountForBusiness(business, tier.qrCodeCount);
        }
      }

      // Award Matching Points for Membership Payment
      if (user.role === 'business') {
        await this.matchingPointService.addPoints(
          user.id,
          MatchingPointActivityType.MEMBERSHIP_PAYMENT,
          `Membership Payment: ${tier.name} (${planType})`,
        );
      }
    }
  }

  private async _awardPackages(businessId: string, packageIds: string[], transactionId: string) {
    const packages = await this.pointPackageRepository.find({
      where: { id: In(packageIds) }
    });

    for (const pointPackage of packages) {
      const businessPointPackage = this.businessPointPackageRepository.create({
        business: { id: businessId },
        package: pointPackage,
        name: pointPackage.name,
        initial_points: pointPackage.points,
        remaining_points: pointPackage.points,
        transaction_id: transactionId,
      });

      await this.businessPointPackageRepository.save(businessPointPackage);
    }
  }

  async initiatePointPurchase(user: any, points: number, amount: number, provider: string) {
    if (provider === 'paypal') {
      const order = await this.paypalService.createPointPurchaseOrder(amount, 'GBP', user.id, points);
      return { orderId: order.result.id };
    } else {
      // Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent(amount * 100, 'gbp', {
        businessId: user.id,
        points: points,
        type: 'POINT_PURCHASE',
      });
      return { clientSecret: paymentIntent.client_secret };
    }
  }

  async verifyPointPurchase(user: any, transactionId: string, provider: string) {
    if (provider === 'paypal') {
      const capture = await this.paypalService.capturePayment(transactionId);
      const result = capture.result as any;

      if (result.status !== 'COMPLETED') {
        throw new BadRequestException(`PayPal payment not completed. Status: ${result.status}`);
      }

      const purchaseUnit = result.purchaseUnits?.[0] || result.purchase_units?.[0];
      if (!purchaseUnit) {
        throw new BadRequestException('Invalid PayPal response: missing purchase information');
      }

      // Verify Business ID
      const referenceId = purchaseUnit.referenceId || purchaseUnit.reference_id;
      if (referenceId !== user.id) {
        throw new BadRequestException('Payment belongs to a different business');
      }

      // Extract points from description (e.g., "Point Purchase: 100 Points")
      const description = purchaseUnit.description;
      const pointsMatch = description.match(/Point Purchase: (\d+) Points/);
      if (!pointsMatch) {
        throw new BadRequestException('Could not determine points from payment description');
      }
      const points = parseInt(pointsMatch[1], 10);

      // Extract Amount
      let amountValue: string | undefined;
      if (purchaseUnit.payments?.captures?.length > 0) {
        amountValue = purchaseUnit.payments.captures[0].amount?.value;
      } else if (purchaseUnit.amount) {
        amountValue = purchaseUnit.amount.value;
      }

      return {
        status: 'succeeded',
        points: points,
        amount: parseFloat(amountValue || '0'),
        transactionId: result.id,
      };

    } else {
      // Stripe
      const paymentIntent = await this.stripeService.verifyPayment(transactionId);
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Stripe payment not succeeded. Status: ${paymentIntent.status}`);
      }

      if (paymentIntent.metadata.type !== 'POINT_PURCHASE') {
        throw new BadRequestException('Invalid payment type');
      }

      if (paymentIntent.metadata.businessId !== user.id) {
        throw new BadRequestException('Payment belongs to a different business');
      }

      return {
        status: 'succeeded',
        points: parseInt(paymentIntent.metadata.points, 10),
        amount: paymentIntent.amount / 100,
        transactionId: paymentIntent.id,
      };
    }
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    try {
      const event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      );

      const invoice: any = event.data.object;
      const customerId = invoice.customer;
      const business = await this.businessRepository.findOne({ where: { stripe_customer_id: customerId } });

      if (business) {
        if (event.type === 'invoice.payment_succeeded') {
          const subscription: any = await this.stripeService.stripe.subscriptions.retrieve(invoice.subscription);
          const tier = await this.tierRepository.findOne({ where: { id: subscription.metadata.tier_id } });

          const expiresAt = new Date(subscription.current_period_end * 1000);

          await this._createOrUpdateMembership(
            business,
            tier,
            subscription.metadata.plan_type as PlanType,
            invoice.amount_paid / 100,
            PaymentProvider.STRIPE,
            invoice.payment_intent,
            false,
            expiresAt,
          );
        } else if (event.type === 'invoice.payment_failed') {
          const membership = await this.membershipRepository.findOne({ where: { business: { id: business.id } } });
          if (membership) {
            membership.status = MembershipStatus.EXPIRED;
            await this.membershipRepository.save(membership);
          }
        }
      }
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  async initiatePackagePurchase(user: any, packageId: string, amount: number, provider: string) {
    if (provider === 'paypal') {
      throw new BadRequestException('PayPal for packages not fully implemented yet');
    } else {
      // Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent(amount * 100, 'gbp', {
        businessId: user.id,
        packageId: packageId,
        type: 'PACKAGE_PURCHASE',
      });
      return { clientSecret: paymentIntent.client_secret };
    }
  }

  async verifyPackagePurchase(user: any, transactionId: string, provider: string) {
    if (provider === 'paypal') {
      throw new BadRequestException('PayPal for packages not fully implemented yet');
    } else {
      // Stripe
      const paymentIntent = await this.stripeService.verifyPayment(transactionId);
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Stripe payment not succeeded. Status: ${paymentIntent.status}`);
      }

      if (paymentIntent.metadata.type !== 'PACKAGE_PURCHASE') {
        throw new BadRequestException('Invalid payment type');
      }

      if (paymentIntent.metadata.businessId !== user.id) {
        throw new BadRequestException('Payment belongs to a different business');
      }

      return {
        status: 'succeeded',
        packageId: paymentIntent.metadata.packageId,
        amount: paymentIntent.amount / 100,
        transactionId: paymentIntent.id,
      };
    }
  }
}
