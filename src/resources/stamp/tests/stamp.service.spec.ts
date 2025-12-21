import { Test, TestingModule } from "@nestjs/testing";
import { StampService } from "../services/stamp.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { StampRewardTemplate } from "../entities/stamp-reward-template.entity";
import { BusinessStampReward } from "../entities/business-stamp-reward.entity";
import { StampCard } from "../entities/stamp-card.entity";
import { StampEvent } from "../entities/stamp-event.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Business } from "../../business/entities/business.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { DataSource, Repository } from "typeorm";
import { StampTriggerMethod } from "../enums/stamp-trigger-method.enum";
import { StampCardStatus } from "../enums/stamp-card-status.enum";

describe("StampService", () => {
  let service: StampService;
  let stampCardRepo: Repository<StampCard>;
  let businessRewardRepo: Repository<BusinessStampReward>;
  let participantRepo: Repository<Participant>;
  let dataSource: DataSource;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
    increment: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StampService,
        {
          provide: getRepositoryToken(StampRewardTemplate),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessStampReward),
          useValue: mockRepo,
        },
        { provide: getRepositoryToken(StampCard), useValue: mockRepo },
        { provide: getRepositoryToken(StampEvent), useValue: mockRepo },
        { provide: getRepositoryToken(Participant), useValue: mockRepo },
        { provide: getRepositoryToken(Business), useValue: mockRepo },
        { provide: getRepositoryToken(Staff), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<StampService>(StampService);
    stampCardRepo = module.get(getRepositoryToken(StampCard));
    businessRewardRepo = module.get(getRepositoryToken(BusinessStampReward));
    participantRepo = module.get(getRepositoryToken(Participant));
    dataSource = module.get(DataSource);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addStamp", () => {
    it("should add a stamp when triggered", async () => {
      const participant = { id: "p1" };
      const reward = {
        id: "r1",
        is_active: true,
        template: {
          trigger_method: StampTriggerMethod.PURCHASE,
          required_stamps: 5,
          is_hybrid: false,
        },
      };

      participantRepo.findOne = jest.fn().mockResolvedValue(participant);
      businessRewardRepo.find = jest.fn().mockResolvedValue([reward]);

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null), // No existing card
        create: jest.fn().mockImplementation((entity, dto) => dto),
        save: jest
          .fn()
          .mockImplementation((entity, dto) => Promise.resolve(dto || entity)),
        increment: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation((cb) => cb(mockManager));

      const result = await service.addStamp(
        "b1",
        "p1",
        StampTriggerMethod.PURCHASE,
      );

      expect(mockManager.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
