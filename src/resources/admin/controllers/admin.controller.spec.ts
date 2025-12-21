import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "../services/admin.service";
import { MatchingPointsService } from "../../participant-campaign-balance/services/matching-points.service";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { PageDto } from "../../../common/dto/page.dto";
import { Business } from "../../business/entities/business.entity";

describe("AdminController", () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getBusinesses: jest.fn(),
  };

  const mockMatchingPointsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: MatchingPointsService,
          useValue: mockMatchingPointsService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getBusinesses", () => {
    it("should return a paginated list of businesses", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result: PageDto<Business> = {
        data: [],
        total: 0,
      };

      mockAdminService.getBusinesses.mockResolvedValue(result);

      expect(await controller.getBusinesses(paginationDto)).toBe(result);
      expect(adminService.getBusinesses).toHaveBeenCalledWith(1, 10);
    });
  });
});
