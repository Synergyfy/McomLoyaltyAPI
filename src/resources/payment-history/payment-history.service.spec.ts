import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PaymentHistoryService } from "./payment-history.service";
import { PaymentHistory } from "./entities/payment-history.entity";

describe("PaymentHistoryService", () => {
  let service: PaymentHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentHistoryService,
        {
          provide: getRepositoryToken(PaymentHistory),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentHistoryService>(PaymentHistoryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
