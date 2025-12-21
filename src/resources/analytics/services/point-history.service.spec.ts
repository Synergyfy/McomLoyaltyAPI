import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PointHistoryService } from "./point-history.service";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { Repository } from "typeorm";

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
};

describe("PointHistoryService", () => {
  let service: PointHistoryService;
  let repository: Repository<PointHistory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointHistoryService,
        {
          provide: getRepositoryToken(PointHistory),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<PointHistoryService>(PointHistoryService);
    repository = module.get<Repository<PointHistory>>(
      getRepositoryToken(PointHistory),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should apply businessId filter", async () => {
    const filterDto = { businessId: "some-uuid", page: 1, limit: 10 };
    await service.findAll(filterDto);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith("pointHistory");
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      "pointHistory.business_id = :businessId",
      {
        businessId: "some-uuid",
      },
    );
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
  });
});
