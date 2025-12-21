import { Test, TestingModule } from "@nestjs/testing";
import { CampaignService } from "./campaign.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Campaign } from "./entities/campaign.entity";
import { Business } from "../business/entities/business.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Staff } from "../staff/entities/staff.entity";
import { WishlistAggregate } from "../wishlist/entities/wishlist-aggregate.entity";
import { WishlistItem } from "../wishlist/entities/wishlist-item.entity";
import { Tier } from "../tier/entities/tier.entity";
import { MailService } from "../../mail/mail.service";
import { Role } from "../../common/role.enum";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreateCampaignAdminDto } from "./dto/create-campaign-admin.dto";

describe("CampaignService - Tier Validation", () => {
  let service: CampaignService;
  let campaignRepository: any;
  let tierRepository: any;
  let rewardRepository: any;

  const mockCampaignRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((campaign) =>
        Promise.resolve({ id: "campaign-id", ...campaign }),
      ),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTierRepository = {
    findOneBy: jest.fn(),
  };

  const mockRewardRepository = {
    findBy: jest.fn(),
  };

  const mockBusinessRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        { provide: getRepositoryToken(Reward), useValue: mockRewardRepository },
        { provide: getRepositoryToken(BusinessReward), useValue: {} },
        { provide: getRepositoryToken(BusinessCampaign), useValue: {} },
        { provide: getRepositoryToken(PointHistory), useValue: {} },
        { provide: getRepositoryToken(Participant), useValue: {} },
        { provide: getRepositoryToken(Staff), useValue: {} },
        { provide: getRepositoryToken(WishlistAggregate), useValue: {} },
        { provide: getRepositoryToken(WishlistItem), useValue: {} },
        { provide: getRepositoryToken(Tier), useValue: mockTierRepository },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    campaignRepository = module.get(getRepositoryToken(Campaign));
    tierRepository = module.get(getRepositoryToken(Tier));
    rewardRepository = module.get(getRepositoryToken(Reward));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create (Admin)", () => {
    const adminUser = { id: "admin-id", role: Role.Admin } as any;
    const createDto: CreateCampaignAdminDto = {
      name: "Test Campaign",
      reward_ids: ["r1", "r2"],
      target_tier_id: "tier-id",
    } as any;

    it("should create campaign successfully when rewards are within tier limit", async () => {
      const tier = {
        id: "tier-id",
        name: "Bronze",
        configuration: {
          quotas: {
            maxRewardsPerCampaign: 5,
          },
        },
      };
      mockTierRepository.findOneBy.mockResolvedValue(tier);
      mockRewardRepository.findBy.mockResolvedValue([
        { id: "r1" },
        { id: "r2" },
      ]);

      const result = await service.create(createDto, adminUser);

      expect(mockTierRepository.findOneBy).toHaveBeenCalledWith({
        id: "tier-id",
      });
      expect(result).toHaveProperty("targetTier", tier);
      expect(mockCampaignRepository.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException when rewards exceed tier limit", async () => {
      const tier = {
        id: "tier-id",
        name: "Bronze",
        configuration: {
          quotas: {
            maxRewardsPerCampaign: 1,
          },
        },
      };
      mockTierRepository.findOneBy.mockResolvedValue(tier);
      mockRewardRepository.findBy.mockResolvedValue([
        { id: "r1" },
        { id: "r2" },
      ]);

      await expect(service.create(createDto, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should allow unlimited rewards if maxRewardsPerCampaign is -1", async () => {
      const tier = {
        id: "tier-id",
        name: "Gold",
        configuration: {
          quotas: {
            maxRewardsPerCampaign: -1,
          },
        },
      };
      mockTierRepository.findOneBy.mockResolvedValue(tier);
      mockRewardRepository.findBy.mockResolvedValue([
        { id: "r1" },
        { id: "r2" },
      ]);

      const result = await service.create(createDto, adminUser);

      expect(result).toHaveProperty("targetTier", tier);
      expect(mockCampaignRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if target tier is not found", async () => {
      mockTierRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(createDto, adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
