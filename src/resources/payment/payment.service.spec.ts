import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Tier } from '../tier/entities/tier.entity';
import { Membership, PlanType } from '../membership/entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { CouponService } from '../coupon/coupon.service';
import { Coupon, DiscountType } from '../coupon/entities/coupon.entity';
import { Business } from '../business/entities/business.entity';
import { ConfigService } from '@nestjs/config';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockTierRepository = {
    findOne: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBusinessRepository = {
    update: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    verifyPayment: jest.fn(),
    createCustomer: jest.fn(),
    createSubscription: jest.fn(),
  };

  const mockPaypalService = {
    createOrder: jest.fn(),
    capturePayment: jest.fn(),
  };

  const mockCouponService = {
    findOne: jest.fn(),
    findByCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Tier),
          useValue: mockTierRepository,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
        {
          provide: getRepositoryToken(PaymentHistory),
          useValue: mockPaymentHistoryRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: PaypalService,
          useValue: mockPaypalService,
        },
        {
          provide: CouponService,
          useValue: mockCouponService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateStripePayment', () => {
    it('should throw an error if tier not found', async () => {
      mockTierRepository.findOne.mockResolvedValue(null);
      await expect(
        service.initiateStripePayment({ tier_id: '1', plan_type: PlanType.MONTHLY }, {}),
      ).rejects.toThrow('Tier not found');
    });

    it('should initiate a stripe payment without a coupon', async () => {
      mockTierRepository.findOne.mockResolvedValue({ id: '1', monthly_price: 10, annual_price: 100 });
      mockStripeService.createPaymentIntent.mockResolvedValue({ client_secret: 'secret' });
      const result = await service.initiateStripePayment({ tier_id: '1', plan_type: PlanType.MONTHLY }, {});
      expect(result).toEqual({ clientSecret: 'secret' });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(1000, 'gbp', {
        tier_id: '1',
        plan_type: PlanType.MONTHLY,
      });
    });

    it('should initiate a stripe payment with a coupon', async () => {
      mockTierRepository.findOne.mockResolvedValue({ id: '1', monthly_price: 10, annual_price: 100 });
      mockCouponService.findByCode.mockResolvedValue({
        id: '1',
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 5,
        expires_at: new Date(new Date().getTime() + 86400000),
        is_active: true,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({ client_secret: 'secret' });
      const result = await service.initiateStripePayment(
        { tier_id: '1', plan_type: PlanType.MONTHLY, coupon_code: 'coupon' },
        {},
      );
      expect(result).toEqual({ clientSecret: 'secret' });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(500, 'gbp', {
        tier_id: '1',
        plan_type: PlanType.MONTHLY,
      });
    });

    it('should not let the amount be less than 0', async () => {
      mockTierRepository.findOne.mockResolvedValue({ id: '1', monthly_price: 10, annual_price: 100 });
      mockCouponService.findByCode.mockResolvedValue({
        id: '1',
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 15,
        expires_at: new Date(new Date().getTime() + 86400000),
        is_active: true,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({ client_secret: 'secret' });
      const result = await service.initiateStripePayment(
        { tier_id: '1', plan_type: PlanType.MONTHLY, coupon_code: 'coupon' },
        {},
      );
      expect(result).toEqual({ clientSecret: 'secret' });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(0, 'gbp', {
        tier_id: '1',
        plan_type: PlanType.MONTHLY,
      });
    });
  });

  describe('verifyStripePayment', () => {
    it('should create a new membership on successful payment', async () => {
      mockStripeService.verifyPayment.mockResolvedValue({
        status: 'succeeded',
        id: '1',
        amount: 1000,
        metadata: { tier_id: '1', plan_type: 'monthly' },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: '1' });
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue({});
      await service.verifyStripePayment({ transaction_id: '1' }, { id: '1', role: 'user' });
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.create).toHaveBeenCalled();
    });

    it('should update an existing membership on successful payment', async () => {
      mockStripeService.verifyPayment.mockResolvedValue({
        status: 'succeeded',
        id: '1',
        amount: 1000,
        metadata: { tier_id: '1', plan_type: 'monthly' },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: '1' });
      mockMembershipRepository.findOne.mockResolvedValue({});
      await service.verifyStripePayment({ transaction_id: '1' }, { id: '1', role: 'user' });
      expect(mockMembershipRepository.save).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.save).toHaveBeenCalled();
    });

    it('should not create a membership on failed payment', async () => {
      mockStripeService.verifyPayment.mockResolvedValue({ status: 'failed' });
      await service.verifyStripePayment({ transaction_id: '1' }, { id: '1', role: 'user' });
      expect(mockMembershipRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('initiatePaypalPayment', () => {
    it('should initiate a paypal payment', async () => {
      mockTierRepository.findOne.mockResolvedValue({ id: '1', monthly_price: 10, annual_price: 100 });
      mockPaypalService.createOrder.mockResolvedValue({ result: { id: '1' } });
      const result = await service.initiatePaypalPayment({ tier_id: '1', plan_type: PlanType.MONTHLY }, {});
      expect(result).toEqual({ orderId: '1' });
      expect(mockPaypalService.createOrder).toHaveBeenCalledWith(10, 'GBP', '1', PlanType.MONTHLY);
    });
  });

  describe('verifyPaypalPayment', () => {
    it('should create a new membership on successful payment', async () => {
      mockPaypalService.capturePayment.mockResolvedValue({
        result: {
          status: 'COMPLETED',
          id: '1',
          purchaseUnits: [{ referenceId: '1', description: 'monthly', amount: { value: '10' } }],
        },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: '1' });
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue({});
      await service.verifyPaypalPayment({ transaction_id: '1' }, { id: '1', role: 'user' });
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.create).toHaveBeenCalled();
    });
  });
});
