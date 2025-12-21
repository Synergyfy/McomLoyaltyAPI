import { Test, TestingModule } from "@nestjs/testing";
import { PaymentHistoryController } from "./payment-history.controller";
import { PaymentHistoryService } from "./payment-history.service";

describe("PaymentHistoryController", () => {
  let controller: PaymentHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentHistoryController],
      providers: [
        {
          provide: PaymentHistoryService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentHistoryController>(PaymentHistoryController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
