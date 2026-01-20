import { Test, TestingModule } from "@nestjs/testing";
import { CampaignService } from "./campaign.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Campaign } from "./entities/campaign.entity";
import { Business } from "../business/entities/business.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { Repository } from "typeorm";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { CreateCampaignAdminDto } from "./dto/create-campaign-admin.dto";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { Role } from "../../common/role.enum";
import { Admin } from "../admin/entities/admin.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { Participant } from "../participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { Staff } from "../staff/entities/staff.entity";
import { WishlistAggregate } from "../wishlist/entities/wishlist-aggregate.entity";
import { WishlistItem } from "../wishlist/entities/wishlist-item.entity";
import { MailService } from "src/mail/mail.service";
import {
  Membership,
  MembershipStatus,
} from "../membership/entities/membership.entity";

import { Tier } from "../tier/entities/tier.entity";
import { TierProgressionService } from "../tier-progression/tier-progression.service";
import { CapabilityService } from "../capability/capability.service";

describe("CampaignService", () => {
  let service: CampaignService;
  let campaignRepository: Repository<Campaign>;
  let businessRepository: Repository<Business>;
  let rewardRepository: Repository<Reward>;
  let businessCampaignRepository: Repository<BusinessCampaign>;

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawOne: jest.fn().mockResolvedValue({}),
      getCount: jest.fn().mockResolvedValue(0),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockBusinessRepository = {
    findOneBy: jest.fn(),
  };

  const mockRewardRepository = {
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockBusinessRewardRepository = {
    find: jest.fn(),
  };

  const mockBusinessCampaignRepository = {
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
  };

  const mockPointHistoryRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({}),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    query: jest.fn().mockResolvedValue([]),
  };

  const mockParticipantRepository = {
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockParticipantCampaignBalanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([
      {
        status: MembershipStatus.ACTIVE,
        expires_at: new Date(Date.now() + 10000000),
      },
    ]),
  };

  const mockTierRepository = {
    findOneBy: jest.fn(),
  };

  const mockTierProgressionService = {
    checkAndPromote: jest.fn(),
  };

  const mockCapabilityService = {
    checkPermission: jest.fn(),
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
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRewardRepository,
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: mockPointHistoryRepository,
        },
        {
          provide: getRepositoryToken(BusinessReward),
          useValue: mockBusinessRewardRepository,
        },
        {
          provide: getRepositoryToken(BusinessCampaign),
          useValue: mockBusinessCampaignRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WishlistAggregate),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(WishlistItem),
          useValue: { find: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendWishlistCampaignEmail: jest.fn() },
        },

        {
          provide: getRepositoryToken(Tier),
          useValue: mockTierRepository,
        },
        {
          provide: getRepositoryToken(ParticipantCampaignBalance),
          useValue: mockParticipantCampaignBalanceRepository,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
        {
          provide: TierProgressionService,
          useValue: mockTierProgressionService,
        },
        {
          provide: CapabilityService,
          useValue: mockCapabilityService,
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    campaignRepository = module.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    businessRepository = module.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
    rewardRepository = module.get<Repository<Reward>>(
      getRepositoryToken(Reward),
    );
    businessCampaignRepository = module.get<Repository<BusinessCampaign>>(
      getRepositoryToken(BusinessCampaign),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a campaign for an admin", async () => {
      const createCampaignDto: CreateCampaignAdminDto = {
        name: "Test Campaign",
        campaign_type: "qr_code" as any,
        campaign_message: "Test Message",
        audience_type: "members" as any,
        banner_url: "test.jpg",
        reward_ids: ["reward-id"],
        reward_mode: "points" as any,
        regular_points_threshold: 100,
      };

      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const business = { id: "business-id" } as Business;
      const rewards = [{ id: "reward-id" }] as Reward[];
      const { reward_ids, ...campaignData } = createCampaignDto;
      const campaign = { ...campaignData, business, rewards };

      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      mockRewardRepository.findBy.mockResolvedValue(rewards);
      mockCampaignRepository.create.mockReturnValue(campaign);
      mockCampaignRepository.save.mockResolvedValue(campaign);

      const result = await service.create(createCampaignDto, currentUser);

      expect(result).toEqual(
        expect.objectContaining({
          name: "Test Campaign",
          business: expect.objectContaining({ id: "business-id" }),
          rewards: expect.any(Array),
        }),
      );
    });

    it("should create a campaign for a business", async () => {
      const createCampaignDto: CreateCampaignDto = {
        total_slots: 100,
        name: "Test Campaign",
        campaign_type: "qr_code" as any,
        campaign_message: "Test Message",
        start_date: new Date(),
        end_date: new Date(),
        audience_type: "members" as any,
        banner_url: "test.jpg",
        business_reward_ids: ["reward-id"],
        reward_mode: "points" as any,
        regular_points_threshold: 100,
      };

      const currentUser = {
        id: "business-id",
        role: Role.Business,
      } as Business;

      const business = { id: "business-id" } as Business;
      const rewards = [{ id: "reward-id" }] as Reward[];
      const businessRewards = [
        {
          id: "business-reward-id",
          reward: rewards[0],
          business: { id: "business-id" },
        },
      ] as any[];
      const campaign = { ...createCampaignDto, business, businessRewards };

      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      mockBusinessRewardRepository.find.mockResolvedValue(businessRewards);
      mockCampaignRepository.create.mockReturnValue(campaign);
      mockCampaignRepository.save.mockResolvedValue(campaign);

      const result = await service.create(createCampaignDto, currentUser);

      expect(result).toEqual(
        expect.objectContaining({
          name: "Test Campaign",
          business: expect.objectContaining({ id: "business-id" }),
          businessRewards: expect.any(Array),
          uniqueCode: expect.any(String),
        }),
      );
    });

    it("should generate a unique code for a business-created campaign", async () => {
      const createCampaignDto: CreateCampaignDto = {
        total_slots: 100,
        name: "Test Campaign",
        campaign_type: "qr_code" as any,
        campaign_message: "Test Message",
        start_date: new Date(),
        end_date: new Date(),
        audience_type: "members" as any,
        banner_url: "test.jpg",
        business_reward_ids: ["reward-id"],
        reward_mode: "points" as any,
        regular_points_threshold: 100,
      };

      const currentUser = {
        id: "business-id",
        role: Role.Business,
      } as Business;

      const business = { id: "business-id" } as Business;
      const rewards = [{ id: "reward-id" }] as Reward[];
      const businessRewards = [
        {
          id: "business-reward-id",
          reward: rewards[0],
          business: { id: "business-id" },
        },
      ] as any[];
      const campaign = {
        ...createCampaignDto,
        business,
        businessRewards,
        uniqueCode: "123456789",
      };

      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      mockBusinessRewardRepository.find.mockResolvedValue(businessRewards);
      mockCampaignRepository.create.mockReturnValue(campaign);
      mockCampaignRepository.save.mockResolvedValue(campaign);

      const result = await service.create(createCampaignDto, currentUser);

      expect(result.uniqueCode).toBeDefined();
      expect(result.uniqueCode).toHaveLength(9);
    });
  });

  describe("findAll", () => {
    it("should return all campaigns for an admin", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const campaigns = [[{ id: "campaign-1" }, { id: "campaign-2" }], 2] as [
        Campaign[],
        number,
      ];
      mockCampaignRepository.findAndCount.mockResolvedValue(campaigns);

      const result = await service.findAll(currentUser, paginationDto);

      expect(result.data).toEqual(campaigns[0]);
    });

    it("should return only business campaigns for a business user", async () => {
      const currentUser = {
        id: "business-id",
        role: Role.Business,
      } as Business;
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const campaigns = [[{ id: "bc-1" }], 1] as [any[], number];
      const businessCampaignRepo = businessCampaignRepository;
      (businessCampaignRepo.findAndCount as jest.Mock).mockResolvedValue(
        campaigns,
      );

      const result = await service.findAll(currentUser, paginationDto);

      expect(result.data).toEqual(campaigns[0]);
    });
  });

  describe("findOne", () => {
    it("should return a campaign for an admin", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne("campaign-1", currentUser);

      expect(result).toEqual(campaign);
    });

    it("should return a campaign for the business owner", async () => {
      const currentUser = {
        id: "business-id",
        role: Role.Business,
      } as Business;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne("campaign-1", currentUser);

      expect(result).toEqual(campaign);
    });

    it("should throw an unauthorized exception for a non-owner business", async () => {
      const currentUser = {
        id: "other-business-id",
        role: Role.Business,
      } as Business;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      await expect(service.findOne("campaign-1", currentUser)).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("update", () => {
    it("should update a campaign", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
      } as Campaign;
      const updateCampaignDto = { name: "Updated Campaign" };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...campaign,
        ...updateCampaignDto,
      });

      const result = await service.update(
        "campaign-1",
        updateCampaignDto as any,
        currentUser,
      );

      expect(result.name).toEqual("Updated Campaign");
    });

    it("should update a campaign rewards", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
        rewards: [],
      } as Campaign;
      const updateCampaignDto = { reward_ids: ["new-reward-id"] };
      const rewards = [{ id: "new-reward-id" }] as Reward[];

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockRewardRepository.findBy.mockResolvedValue(rewards);
      mockCampaignRepository.save.mockResolvedValue({
        ...campaign,
        rewards,
      });

      const result = await service.update(
        "campaign-1",
        updateCampaignDto as any,
        currentUser,
      );

      expect(result).toHaveProperty("rewards");
      expect((result as any).rewards).toEqual(rewards);
    });
  });

  describe("remove", () => {
    it("should remove a campaign", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.remove.mockResolvedValue(undefined);

      await service.remove("campaign-1", currentUser);

      expect(mockCampaignRepository.remove).toHaveBeenCalledWith(campaign);
    });
  });

  describe("findOngoingCampaigns", () => {
    it("should return ongoing campaigns", async () => {
      const campaigns = [{ id: "campaign-1" }] as BusinessCampaign[];
      (businessCampaignRepository.find as jest.Mock).mockResolvedValue(
        campaigns,
      );

      const result = await service.findOngoingCampaigns();

      expect(result).toEqual(campaigns);
    });
  });

  describe("toggleCampaignStatus", () => {
    it("should toggle the campaign status", async () => {
      const currentUser = {
        id: "admin-id",
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: "campaign-1",
        business: { id: "business-id" },
        disabled: false,
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...campaign,
        disabled: true,
      });

      const result = await service.toggleCampaignStatus(
        "campaign-1",
        currentUser,
      );

      expect(result.disabled).toEqual(true);
    });
  });

  describe("findClaimableCampaigns", () => {
    it("should return a paginated list of claimable campaigns", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const campaigns = [[{ id: "campaign-1" }], 1] as [Campaign[], number];
      (campaignRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue(campaigns),
        getCount: jest.fn().mockResolvedValue(1),
        getRawMany: jest.fn().mockResolvedValue(campaigns[0]),
      });

      const result = await service.findClaimableCampaigns(
        "business-id",
        paginationDto,
      );

      expect(result.data).toEqual(campaigns[0]);
    });
  });

  describe("claimCampaign", () => {
    it("should allow a business to claim a campaign and generate a unique code", async () => {
      mockBusinessRewardRepository.find.mockResolvedValue([]);
      const campaign = { id: "campaign-1", business: null } as Campaign;
      const business = { id: "business-id" } as Business;
      const businessCampaign = {
        business,
        campaign,
        uniqueCode: "123456789",
      } as BusinessCampaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      (businessCampaignRepository.findOne as jest.Mock).mockResolvedValue(null);
      (businessCampaignRepository.create as jest.Mock).mockReturnValue(
        businessCampaign,
      );
      (businessCampaignRepository.save as jest.Mock).mockResolvedValue(
        businessCampaign,
      );

      const result = await service.claimCampaign(
        "business-id",
        "campaign-id",
        [],
        new Date(),
        new Date(),
        100,
      );

      expect(result.uniqueCode).toBeDefined();
      expect(result.uniqueCode).toHaveLength(9);
    });

    it("should throw an error if the campaign is already claimed", async () => {
      const campaign = { id: "campaign-1", business: null } as Campaign;
      const business = { id: "business-id" } as Business;
      const businessCampaign = { business, campaign } as BusinessCampaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      (businessCampaignRepository.findOne as jest.Mock).mockResolvedValue(
        businessCampaign,
      );

      await expect(
        service.claimCampaign(
          "business-id",
          "campaign-id",
          [],
          new Date(),
          new Date(),
        ),
      ).rejects.toThrow("Campaign already claimed");
    });
  });

  describe("findAllByBusiness", () => {
    it("should return a paginated list of claimed campaigns", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const businessCampaigns = [
        [{ id: "bc-1", campaign: { id: "campaign-1" } }],
        1,
      ] as [BusinessCampaign[], number];
      (businessCampaignRepository.findAndCount as jest.Mock).mockResolvedValue(
        businessCampaigns,
      );

      const result = await service.findAllByBusiness(
        "business-id",
        paginationDto,
      );

      // Now it returns the businessCampaign objects
      expect(result.data).toEqual(businessCampaigns[0]);
    });
  });

  describe("getCampaignAnalytics", () => {
    it("should return detailed analytics for a campaign", async () => {
      const analytics = {
        total_participants: "1",
        total_rewards_redeemed: "1",
        total_points_awarded: "100",
      };
      (
        mockPointHistoryRepository.createQueryBuilder as jest.Mock
      ).mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(analytics),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getCampaignAnalytics(
        "campaign-id",
        "business-id",
      );

      expect(result.total_participants).toEqual(analytics.total_participants);
    });
  });
});
