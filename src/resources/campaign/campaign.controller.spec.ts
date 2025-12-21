import { Test, TestingModule } from "@nestjs/testing";
import { CampaignController } from "./campaign.controller";
import { CampaignService } from "./campaign.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Campaign } from "./entities/campaign.entity";
import { Business } from "../business/entities/business.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { Participant } from "../participant/entities/participant.entity";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("CampaignController", () => {
  let controller: CampaignController;

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessRepository = {
    findOneBy: jest.fn(),
  };

  const mockRewardRepository = {
    findBy: jest.fn(),
  };

  const mockPointHistoryRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockParticipantRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
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
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(BusinessReward),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BusinessCampaign),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
