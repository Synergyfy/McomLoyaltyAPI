import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessService } from "./business.service";
import { Business } from "../entities/business.entity";
import { Referral } from "../../referral/entities/referral.entity";
import { HashService } from "../../../common/hash/hash.service";
import { SectorService } from "../../sector/services/sector.service";
import { CategoryService } from "../../category/category.service";
import { SubcategoryService } from "../../subcategory/subcategory.service";
import { PaymentHistoryService } from "../../payment-history/payment-history.service";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { SystemSettingService } from "../../system-setting/services/system-setting.service";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { BusinessReward } from "../../rewards/entities/business-reward.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Network } from "../../network/entities/network.entity";
import { PaymentService } from "../../payment/payment.service";
import { MatchingPointService } from "../../matching-point/services/matching-point.service";
import { ReferralService } from "../../referral/referral.service";
import { OtpService } from "../../otp/otp.service";
import { MailService } from "../../../mail/mail.service";
import { WalletService } from "../../wallet/wallet.service";
import { StampPackageService } from "../../stamp/services/stamp-package.service";
import { ProvisionService } from "../../provision/provision.service";
import { MembershipService } from "../../membership/membership.service";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { ProvisionType } from "../../provision/entities/provision.entity";
import { BadRequestException } from "@nestjs/common";

describe("BusinessService", () => {
  let service: BusinessService;
  let provisionService: ProvisionService;
  let membershipService: MembershipService;

  // Mock Repositories
  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock Services
  const mockService = {
      // Add specific methods if needed, default to jest.fn()
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
  };

  const mockProvisionService = {
      findByCode: jest.fn(),
      validateAndMarkRedeemed: jest.fn(),
  };

  const mockMembershipService = {
      grantAccess: jest.fn(),
  };

  const mockMailService = {
      sendOtp: jest.fn(),
  }

  const mockWalletService = {
      createWallet: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: getRepositoryToken(Business), useValue: mockRepo },
        { provide: getRepositoryToken(Referral), useValue: mockRepo },
        { provide: getRepositoryToken(PointHistory), useValue: mockRepo },
        { provide: getRepositoryToken(BusinessCampaign), useValue: mockRepo },
        { provide: getRepositoryToken(BusinessReward), useValue: mockRepo },
        { provide: getRepositoryToken(Staff), useValue: mockRepo },
        { provide: getRepositoryToken(Network), useValue: mockRepo },
        { provide: HashService, useValue: { hashPassword: jest.fn().mockResolvedValue("hashed") } },
        { provide: SectorService, useValue: mockService },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockService },
        { provide: PaymentHistoryService, useValue: mockService },
        { provide: SystemSettingService, useValue: mockService },
        { provide: PaymentService, useValue: mockService },
        { provide: MatchingPointService, useValue: mockService },
        { provide: ReferralService, useValue: mockService },
        { provide: OtpService, useValue: { create: jest.fn() } },
        { provide: MailService, useValue: mockMailService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: StampPackageService, useValue: mockService },
        { provide: ProvisionService, useValue: mockProvisionService },
        { provide: MembershipService, useValue: mockMembershipService },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    provisionService = module.get<ProvisionService>(ProvisionService);
    membershipService = module.get<MembershipService>(MembershipService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a business with a valid provision code", async () => {
      const dto: CreateBusinessDto = {
        name: "Test Business",
        email: "test@business.com",
        password: "password",
        confirmPassword: "password",
        provisionCode: "VALID-PROV",
      };

      const provisionMock = {
          code: "VALID-PROV",
          isRedeemed: false,
          expiresAt: new Date(Date.now() + 100000),
          type: ProvisionType.TIER_ACCESS,
          payload: { tierId: "gold", durationDays: 30 }
      };

      mockRepo.findOne.mockResolvedValue(null); // No existing email/affiliate
      mockProvisionService.findByCode.mockResolvedValue(provisionMock);
      mockRepo.create.mockReturnValue({ id: "bus-1", ...dto });
      mockRepo.save.mockResolvedValue({ id: "bus-1", ...dto, email: dto.email });
      mockProvisionService.validateAndMarkRedeemed.mockResolvedValue(provisionMock);

      await service.create(dto);

      expect(provisionService.findByCode).toHaveBeenCalledWith("VALID-PROV");
      expect(provisionService.validateAndMarkRedeemed).toHaveBeenCalledWith("VALID-PROV", "bus-1");
      expect(membershipService.grantAccess).toHaveBeenCalledWith("bus-1", "gold", 30, "PROVISION");
    });

    it("should throw BadRequest if provision code is invalid/redeemed", async () => {
        const dto: CreateBusinessDto = {
            name: "Test Business",
            email: "test@business.com",
            password: "password",
            confirmPassword: "password",
            provisionCode: "INVALID-PROV",
          };

        mockRepo.findOne.mockResolvedValue(null);
        mockProvisionService.findByCode.mockResolvedValue(null);

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });
});