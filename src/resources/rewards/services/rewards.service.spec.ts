import { Test, TestingModule } from "@nestjs/testing";
import { RewardsService } from "./rewards.service";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Reward } from "../entities/reward.entity";
import { BusinessReward } from "../entities/business-reward.entity";
import { Business } from "../../business/entities/business.entity";
import { Membership } from "../../membership/entities/membership.entity";
import { Sector } from "../../sector/entities/sector.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Category } from "../../category/entities/category.entity";
import { SubCategory } from "../../subcategory/entities/subcategory.entity";
import { LibraryAsset } from "../../library-assets/entities/library-asset.entity";
import { TierProgressionService } from "../../tier-progression/tier-progression.service";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { CreateRewardDto } from "../dto/create-reward.dto";
import { RewardType } from "../enums/reward-type.enum";
import { BadgeLevel } from "../enums/badge-level.enum";
import { RewardSource } from "../enums/reward-source.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("RewardsService", () => {
  let service: RewardsService;
  let rewardRepository: Repository<Reward>;
  let sectorRepository: Repository<Sector>;
  let tierRepository: Repository<Tier>;

  const mockRewardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockBusinessRewardRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
  };
  const mockMembershipRepository = {
    findOne: jest.fn(),
  };

  const mockSectorRepository = {
    findBy: jest.fn(),
  };

  const mockTierRepository = {
    findBy: jest.fn(),
  };

  const mockBusinessCampaignRepository = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockTierProgressionService = {
    checkAndPromote: jest.fn(),
  };
  const mockLibraryAssetRepository = {
    findOne: jest.fn(),
  };
  const mockCategoryRepository = {
    findOne: jest.fn(),
  };
  const mockSubCategoryRepository = {
    findOne: jest.fn(),
  };
  const mockPointHistoryRepository = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getRepositoryToken(Reward), useValue: mockRewardRepository },
        {
          provide: getRepositoryToken(BusinessReward),
          useValue: mockBusinessRewardRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
        { provide: getRepositoryToken(Sector), useValue: mockSectorRepository },
        { provide: getRepositoryToken(Tier), useValue: mockTierRepository },
        {
          provide: getRepositoryToken(BusinessCampaign),
          useValue: mockBusinessCampaignRepository,
        },
        {
          provide: TierProgressionService,
          useValue: mockTierProgressionService,
        },
        {
          provide: getRepositoryToken(LibraryAsset),
          useValue: mockLibraryAssetRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(SubCategory),
          useValue: mockSubCategoryRepository,
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: mockPointHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardRepository = module.get<Repository<Reward>>(
      getRepositoryToken(Reward),
    );
    sectorRepository = module.get<Repository<Sector>>(
      getRepositoryToken(Sector),
    );
    tierRepository = module.get<Repository<Tier>>(getRepositoryToken(Tier));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createReward", () => {
    const createRewardDto: CreateRewardDto = {
      title: "Test Reward",
      max_points: 100,
      value: 10,
      description: "Test Description",
      image: "image-url",
      reward_type: RewardType.VOUCHER,
      audience: RewardAudience.ALL_BUSINESS,
      status: RewardStatus.ACTIVE,
    };

    it("should create a reward without sectors or tiers", async () => {
      mockRewardRepository.create.mockReturnValue(createRewardDto);
      mockRewardRepository.save.mockResolvedValue(createRewardDto);

      const result = await service.createReward(createRewardDto);
      expect(result).toEqual(createRewardDto);
      expect(mockRewardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createRewardDto,
          sectors: [],
          tiers: [],
        }),
      );
    });

    it("should create a reward with valid sectors", async () => {
      const sectors = [{ id: "s1", name: "Sector 1" }] as Sector[];
      mockSectorRepository.findBy.mockResolvedValue(sectors);
      mockRewardRepository.create.mockReturnValue({
        ...createRewardDto,
        sectors,
      });
      mockRewardRepository.save.mockResolvedValue({
        ...createRewardDto,
        sectors,
      });

      const dto = { ...createRewardDto, sector_ids: ["s1"] };
      const result = await service.createReward(dto);

      expect(mockSectorRepository.findBy).toHaveBeenCalledWith({
        id: expect.any(Object),
      }); // In(['s1'])
      expect(mockRewardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sectors: sectors,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException if sector not found", async () => {
      mockSectorRepository.findBy.mockResolvedValue([]);
      const dto = { ...createRewardDto, sector_ids: ["s1"] };

      await expect(service.createReward(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should create a reward with valid tiers", async () => {
      const tiers = [{ id: "t1", name: "Tier 1" }] as Tier[];
      mockTierRepository.findBy.mockResolvedValue(tiers);
      mockRewardRepository.create.mockReturnValue({
        ...createRewardDto,
        tiers,
      });
      mockRewardRepository.save.mockResolvedValue({
        ...createRewardDto,
        tiers,
      });

      const dto = { ...createRewardDto, tier_ids: ["t1"] };
      const result = await service.createReward(dto);

      expect(mockTierRepository.findBy).toHaveBeenCalledWith({
        id: expect.any(Object),
      });
      expect(mockRewardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tiers: tiers,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException if tier not found", async () => {
      mockTierRepository.findBy.mockResolvedValue([]);
      const dto = { ...createRewardDto, tier_ids: ["t1"] };

      await expect(service.createReward(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
    it("should throw ForbiddenException if neither points nor stamps are provided", async () => {
      const dto = {
        ...createRewardDto,
        max_points: undefined,
        max_stamps_required: undefined,
      };
      await expect(service.createReward(dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("updateBusinessReward", () => {
    const updateDto = { quantity: 50 };
    const businessId = "b1";
    const rewardId = "r1";
    const businessReward = {
      id: rewardId,
      business: { id: businessId },
      quantity: 100,
    } as BusinessReward;

    it("should update a business reward successfully", async () => {
      mockBusinessRewardRepository.findOne.mockResolvedValue(businessReward);
      mockBusinessRewardRepository.save.mockResolvedValue({
        ...businessReward,
        ...updateDto,
      });

      const result = await service.updateBusinessReward(
        businessId,
        rewardId,
        updateDto,
      );

      expect(mockBusinessRewardRepository.findOne).toHaveBeenCalledWith({
        where: { id: rewardId, business: { id: businessId } },
        relations: ["reward"],
      });
      expect(mockBusinessRewardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...businessReward,
          ...updateDto,
        }),
      );
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it("should throw ForbiddenException if reward not found", async () => {
      mockBusinessRewardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBusinessReward(businessId, rewardId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if stamps requested exceed admin max", async () => {
      const reward = { max_stamps_required: 10 } as Reward;
      const br = {
        id: rewardId,
        business: { id: businessId, isSuperBusiness: false },
        reward,
      } as BusinessReward;
      mockBusinessRewardRepository.findOne.mockResolvedValue(br);

      await expect(
        service.updateBusinessReward(businessId, rewardId, {
          stamps_required: 11,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
