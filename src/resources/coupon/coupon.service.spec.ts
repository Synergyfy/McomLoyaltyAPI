import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CouponService } from "./coupon.service";
import { Coupon } from "./entities/coupon.entity";

describe("CouponService", () => {
  let service: CouponService;

  const mockCouponRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: mockCouponRepository,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByCode", () => {
    it("should return a coupon by code", async () => {
      mockCouponRepository.findOne.mockResolvedValue({ id: "1", code: "test" });
      const result = await service.findByCode("test");
      expect(result).toEqual({ id: "1", code: "test" });
    });
  });
});
