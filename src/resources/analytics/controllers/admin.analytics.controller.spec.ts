import { Test, TestingModule } from "@nestjs/testing";
import { AdminAnalyticsController } from "./admin.analytics.controller";
import { AdminAnalyticsService } from "../services/admin.analytics.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PointLogResponseDto } from "../dto/point-log.dto";

describe("AdminAnalyticsController", () => {
  let controller: AdminAnalyticsController;
  let service: AdminAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [
        {
          provide: AdminAnalyticsService,
          useValue: {
            getSystemOverview: jest.fn(),
            getTopBusinesses: jest.fn(),
            getTopRewards: jest.fn(),
            getGrowthActivityChart: jest.fn(),
            getPointLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPointLogs", () => {
    it("should return point logs", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const expectedResult: PointLogResponseDto = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      (service.getPointLogs as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.getPointLogs(paginationDto);

      expect(service.getPointLogs).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
