import { Test, TestingModule } from "@nestjs/testing";
import { BusinessController } from "./controllers/business.controller";
import { BusinessService } from "./services/business.service";
import { Role } from "../../common/role.enum";

describe("BusinessController Endpoints", () => {
  let controller: BusinessController;
  let service: BusinessService;

  const mockBusinessService = {
    getSubscriptionLevel: jest.fn(),
    getBillingHistory: jest.fn(),
    getOnboardingStatus: jest.fn(),
    create: jest.fn(),
    onboarding: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    controller = module.get<BusinessController>(BusinessController);
    service = module.get<BusinessService>(BusinessService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getSubscription", () => {
    it("should return subscription level", async () => {
      const result = { tier: "Gold", status: "active" };
      mockBusinessService.getSubscriptionLevel.mockResolvedValue(result);

      expect(await controller.getSubscription({ user: { id: "1" } })).toBe(
        result,
      );
      expect(mockBusinessService.getSubscriptionLevel).toHaveBeenCalledWith(
        "1",
      );
    });
  });

  describe("getBillingHistory", () => {
    it("should return billing history", async () => {
      const result = [{ amount: 100, date: new Date() }];
      mockBusinessService.getBillingHistory.mockResolvedValue(result);

      expect(await controller.getBillingHistory({ user: { id: "1" } })).toBe(
        result,
      );
      expect(mockBusinessService.getBillingHistory).toHaveBeenCalledWith("1");
    });
  });

  describe("getOnboardingStatus", () => {
    it("should return onboarding status", async () => {
      const result = { isOnboarded: true, missingFields: [] };
      mockBusinessService.getOnboardingStatus.mockResolvedValue(result);

      expect(await controller.getOnboardingStatus({ user: { id: "1" } })).toBe(
        result,
      );
      expect(mockBusinessService.getOnboardingStatus).toHaveBeenCalledWith("1");
    });
  });
});
