import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MembershipService } from "./membership.service";
import { Membership } from "./entities/membership.entity";
import { PaymentHistory } from "../payment-history/entities/payment-history.entity";

describe("MembershipService", () => {
  let service: MembershipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: getRepositoryToken(Membership),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(PaymentHistory),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
