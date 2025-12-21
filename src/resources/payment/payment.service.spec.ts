import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PaymentService } from "./payment.service";
import { Tier } from "../tier/entities/tier.entity";
import { Membership, PlanType } from "../membership/entities/membership.entity";
import { PaymentHistory } from "../payment-history/entities/payment-history.entity";
import { StripeService } from "./stripe.service";
import { PaypalService } from "./paypal.service";
import { CouponService } from "../coupon/coupon.service";
import { Coupon, DiscountType } from "../coupon/entities/coupon.entity";
import { Business } from "../business/entities/business.entity";
import { ConfigService } from "@nestjs/config";
import { QrPlaquesService } from "../qr-plaques/qr-plaques.service";
import { PaymentProvider } from "../payment-history/entities/payment-history.entity";
import { PointPackage } from "../point-package/entities/point-package.entity";
import { BusinessPointPackage } from "../point-package/entities/business-point-package.entity";

describe("PaymentService", () => {
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
    findOne: jest.fn(),
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
    createSubscription: jest.fn(),
    getSubscription: jest.fn(),
  };

  const mockCouponService = {
    findOne: jest.fn(),
    findByCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockQrPlaquesService = {
    ensurePlaqueCountForBusiness: jest.fn(),
  };

  const mockPointPackageRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBusinessPointPackageRepository = {
    create: jest.fn(),
    save: jest.fn(),
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
        {
          provide: QrPlaquesService,
          useValue: mockQrPlaquesService,
        },
        {
          provide: getRepositoryToken(PointPackage),
          useValue: mockPointPackageRepository,
        },
        {
          provide: getRepositoryToken(BusinessPointPackage),
          useValue: mockBusinessPointPackageRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("initiateStripePayment", () => {
    it("should throw an error if tier not found", async () => {
      mockTierRepository.findOne.mockResolvedValue(null);
      await expect(
        service.initiateStripePayment(
          { tier_id: "1", plan_type: PlanType.MONTHLY },
          {},
        ),
      ).rejects.toThrow("Tier not found");
    });

    it("should initiate a stripe payment without a coupon", async () => {
      mockTierRepository.findOne.mockResolvedValue({
        id: "1",
        monthly_price: 10,
        annual_price: 100,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: "secret",
      });
      const result = await service.initiateStripePayment(
        { tier_id: "1", plan_type: PlanType.MONTHLY },
        {},
      );
      expect(result).toEqual({ clientSecret: "secret" });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        1000,
        "gbp",
        {
          tier_id: "1",
          plan_type: PlanType.MONTHLY,
        },
      );
    });

    it("should initiate a stripe payment with a coupon", async () => {
      mockTierRepository.findOne.mockResolvedValue({
        id: "1",
        monthly_price: 10,
        annual_price: 100,
      });
      mockCouponService.findByCode.mockResolvedValue({
        id: "1",
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 5,
        expires_at: new Date(new Date().getTime() + 86400000),
        is_active: true,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: "secret",
      });
      const result = await service.initiateStripePayment(
        { tier_id: "1", plan_type: PlanType.MONTHLY, coupon_code: "coupon" },
        {},
      );
      expect(result).toEqual({ clientSecret: "secret" });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        500,
        "gbp",
        {
          tier_id: "1",
          plan_type: PlanType.MONTHLY,
        },
      );
    });

    it("should not let the amount be less than 0", async () => {
      mockTierRepository.findOne.mockResolvedValue({
        id: "1",
        monthly_price: 10,
        annual_price: 100,
      });
      mockCouponService.findByCode.mockResolvedValue({
        id: "1",
        discount_type: DiscountType.FIXED_AMOUNT,
        discount_value: 15,
        expires_at: new Date(new Date().getTime() + 86400000),
        is_active: true,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: "secret",
      });
      const result = await service.initiateStripePayment(
        { tier_id: "1", plan_type: PlanType.MONTHLY, coupon_code: "coupon" },
        {},
      );
      expect(result).toEqual({ clientSecret: "secret" });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        0,
        "gbp",
        {
          tier_id: "1",
          plan_type: PlanType.MONTHLY,
        },
      );
    });

    it("should initiate a stripe payment with point packages", async () => {
      mockTierRepository.findOne.mockResolvedValue({
        id: "1",
        name: "Gold",
        monthly_price: 10,
        annual_price: 100,
      });
      mockPointPackageRepository.find.mockResolvedValue([
        { id: "pkg1", name: "Package 1", price: 20 },
      ]);
      mockPointPackageRepository.findOne.mockResolvedValue({
        id: "pkg1",
        name: "Package 1",
        tiers: [{ id: "1" }],
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: "secret",
      });

      const result = await service.initiateStripePayment(
        {
          tier_id: "1",
          plan_type: PlanType.MONTHLY,
          point_package_ids: ["pkg1"],
        },
        {},
      );

      expect(result).toEqual({ clientSecret: "secret" });
      // Amount should be 10 (tier) + 20 (package) = 30 * 100 = 3000
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        3000,
        "gbp",
        {
          tier_id: "1",
          plan_type: PlanType.MONTHLY,
          point_package_ids: "pkg1",
        },
      );
    });
  });

  describe("verifyStripePayment", () => {
    it("should create a new membership on successful payment", async () => {
      mockStripeService.verifyPayment.mockResolvedValue({
        status: "succeeded",
        id: "1",
        amount: 1000,
        metadata: { tier_id: "1", plan_type: "monthly" },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: "1", qrCodeCount: 0 });
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue({});
      await service.verifyStripePayment(
        { transaction_id: "1" },
        { id: "1", role: "business" },
      );
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.create).toHaveBeenCalled();
    });

    it("should update an existing membership on successful payment", async () => {
      mockStripeService.verifyPayment.mockResolvedValue({
        status: "succeeded",
        id: "1",
        amount: 1000,
        metadata: { tier_id: "1", plan_type: "monthly" },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: "1", qrCodeCount: 0 });
      mockMembershipRepository.findOne.mockResolvedValue({});
      await service.verifyStripePayment(
        { transaction_id: "1" },
        { id: "1", role: "business" },
      );
      expect(mockMembershipRepository.save).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.save).toHaveBeenCalled();
    });

    it("should not create a membership on failed payment", async () => {
      mockStripeService.verifyPayment.mockResolvedValue({ status: "failed" });
      await service.verifyStripePayment(
        { transaction_id: "1" },
        { id: "1", role: "business" },
      );
      expect(mockMembershipRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("initiatePaypalPayment", () => {
    it("should initiate a paypal payment", async () => {
      mockTierRepository.findOne.mockResolvedValue({
        id: "1",
        monthly_price: 10,
        annual_price: 100,
      });
      mockPaypalService.createOrder.mockResolvedValue({ result: { id: "1" } });
      const result = await service.initiatePaypalPayment(
        { tier_id: "1", plan_type: PlanType.MONTHLY },
        {},
      );
      expect(result).toEqual({ orderId: "1" });
      expect(mockPaypalService.createOrder).toHaveBeenCalledWith(
        10,
        "GBP",
        "1",
        PlanType.MONTHLY,
      );
    });
  });

  describe("verifyPaypalPayment", () => {
    it("should create a new membership on successful payment", async () => {
      mockPaypalService.capturePayment.mockResolvedValue({
        result: {
          status: "COMPLETED",
          id: "1",
          purchaseUnits: [
            {
              referenceId: "1",
              description: "monthly",
              amount: { value: "10" },
            },
          ],
        },
      });
      mockTierRepository.findOne.mockResolvedValue({ id: "1", qrCodeCount: 0 });
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue({});
      await service.verifyPaypalPayment(
        { transaction_id: "1" },
        { id: "1", role: "business" },
      );
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.create).toHaveBeenCalled();
    });
  });

  describe("subscribe", () => {
    it("should create a Stripe subscription for Quarterly plan", async () => {
      const tier = {
        id: "1",
        stripe_quarterly_price_id: "price_123",
        name: "Gold",
      };
      mockTierRepository.findOne.mockResolvedValue(tier);
      mockBusinessRepository.update.mockResolvedValue({});
      mockStripeService.createSubscription.mockResolvedValue({ id: "sub_123" });

      const business = {
        id: "b1",
        name: "Test Biz",
        email: "test@test.com",
        stripe_customer_id: "cus_123",
      };
      const dto = {
        tier_id: "1",
        plan_type: PlanType.QUARTERLY,
        payment_token: "tok_123",
        provider: PaymentProvider.STRIPE,
      };

      await service.subscribe(dto, business as any);

      expect(mockStripeService.createSubscription).toHaveBeenCalledWith(
        "cus_123",
        "price_123",
        undefined,
      );
    });

    it("should create a PayPal subscription for Quarterly plan", async () => {
      const tier = {
        id: "1",
        paypal_quarterly_plan_id: "P-123",
        name: "Gold",
      };
      mockTierRepository.findOne.mockResolvedValue(tier);
      mockPaypalService.createSubscription.mockResolvedValue({
        subscriptionId: "sub_pp_123",
        approvalUrl: "https://paypal.com/approve",
      });

      const business = { id: "b1", name: "Test Biz" };
      const dto = {
        tier_id: "1",
        plan_type: PlanType.QUARTERLY,
        provider: PaymentProvider.PAYPAL,
        return_url: "https://return",
        cancel_url: "https://cancel",
      };

      const result = await service.subscribe(dto, business as any);

      expect(mockPaypalService.createSubscription).toHaveBeenCalledWith(
        "P-123",
        "https://return",
        "https://cancel",
      );
      expect(result).toEqual({
        status: "Subscription initiated",
        subscriptionId: "sub_pp_123",
        approvalUrl: "https://paypal.com/approve",
      });
    });
  });

  describe("verifyPaypalSubscription", () => {
    it("should activate membership on active subscription", async () => {
      const subscription = {
        status: "ACTIVE",
        plan_id: "P-123",
        billing_info: {
          next_billing_time: "2025-01-01T00:00:00Z",
        },
      };
      mockPaypalService.getSubscription.mockResolvedValue(subscription);

      const tier = {
        id: "tier-1",
        paypal_monthly_plan_id: "P-123",
        monthly_price: 10,
        qrCodeCount: 0,
      };
      mockTierRepository.findOne.mockResolvedValue(tier);
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue({});

      const result = await service.verifyPaypalSubscription(
        { subscription_id: "sub-123" },
        { id: "u1", role: "business" },
      );

      expect(result.status).toBe("ACTIVE");
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockPaymentHistoryRepository.create).toHaveBeenCalled();
    });
  });
});
