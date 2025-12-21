import { Test, TestingModule } from "@nestjs/testing";
import { AdminAnalyticsService } from "./admin.analytics.service";
import { Repository, SelectQueryBuilder } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { Participant } from "../../participant/entities/participant.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";
import { Business } from "../../business/entities/business.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { ParticipantCampaignBalance } from "../../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PointLogFilterDto } from "../dto/point-log-filter.dto";

describe("AdminAnalyticsService", () => {
  let service: AdminAnalyticsService;
  let pointHistoryRepository: Repository<PointHistory>;
  let businessRepository: Repository<Business>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: {
            findAndCount: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BusinessCampaign),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ParticipantCampaignBalance),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    pointHistoryRepository = module.get<Repository<PointHistory>>(
      getRepositoryToken(PointHistory),
    );
    businessRepository = module.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPointLogs", () => {
    it("should return paginated point logs using query builder", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockPointHistory = [
        {
          type: PointHistoryType.EARN,
          points: 100,
          created_at: new Date(),
          participant: { name: "John Doe", email: "john@example.com" },
        },
        {
          type: PointHistoryType.MATCHING,
          points: 50,
          created_at: new Date(),
          participant: { name: "Jane Doe", email: "jane@example.com" },
        },
      ];
      const mockTotal = 2;

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockPointHistory, mockTotal]),
      };

      (pointHistoryRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getPointLogs(paginationDto);

      expect(pointHistoryRepository.createQueryBuilder).toHaveBeenCalledWith(
        "ph",
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        "ph.participant",
        "participant",
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        "ph.id",
        "ph.points",
        "ph.type",
        "ph.created_at",
        "participant.name",
        "participant.email",
      ]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "ph.created_at",
        "DESC",
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: [
          {
            name: "John Doe",
            email: "john@example.com",
            points: 100,
            description: PointHistoryType.EARN,
            type: "Regular",
            date: mockPointHistory[0].created_at,
          },
          {
            name: "Jane Doe",
            email: "jane@example.com",
            points: 50,
            description: PointHistoryType.EARN, // Matching mapped to EARN
            type: "Matching",
            date: mockPointHistory[1].created_at,
          },
        ],
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });

    it("should handle missing participant", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockPointHistory = [
        {
          type: PointHistoryType.REDEEM,
          points: 50,
          created_at: new Date(),
          participant: null,
        },
      ];
      const mockTotal = 1;

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockPointHistory, mockTotal]),
      };

      (pointHistoryRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getPointLogs(paginationDto);

      expect(result.data[0].name).toBe("Unknown");
      expect(result.data[0].email).toBe("Unknown");
      expect(result.data[0].type).toBe("Regular");
      expect(result.data[0].description).toBe(PointHistoryType.REDEEM);
    });

    it("should apply filters", async () => {
      const filterDto: PointLogFilterDto = {
        page: 1,
        limit: 10,
        businessId: "some-business-id",
      };
      const mockPointHistory = [];
      const mockTotal = 0;

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockPointHistory, mockTotal]),
      };

      (pointHistoryRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      await service.getPointLogs(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "ph.business_id = :businessId",
        { businessId: "some-business-id" },
      );
    });
  });
});
