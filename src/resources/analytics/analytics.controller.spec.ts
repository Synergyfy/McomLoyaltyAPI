import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { GeneralAnalyticsDto } from "./dto/general-analytics.dto";
import { ChartResponseDto } from "./dto/chart-analytics.dto";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getGeneralAnalytics: jest
              .fn()
              .mockResolvedValue({} as GeneralAnalyticsDto),
            getChartAnalytics: jest
              .fn()
              .mockResolvedValue({ data: [] } as ChartResponseDto),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
