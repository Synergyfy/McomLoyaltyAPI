import { Test, TestingModule } from "@nestjs/testing";
import { TierController } from "./tier.controller";
import { TierService } from "./tier.service";

describe("TierController", () => {
  let controller: TierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TierController],
      providers: [
        {
          provide: TierService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            getTierBreakdown: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TierController>(TierController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should return tier breakdown", async () => {
    const result = await controller.getBreakdown();
    expect(result).toEqual([]);
  });
});
