import { Test, TestingModule } from "@nestjs/testing";
import { PointEarningService } from "./point-earning.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Staff } from "../../staff/entities/staff.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../entities/participant-campaign-balance.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { PointHistory } from "../entities/point-history.entity";
import { DataSource } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { Business } from "src/resources/business/entities/business.entity";
import { BusinessCampaign } from "src/resources/campaign/entities/business-campaign.entity";
import {
  CapabilityService,
  ActionType,
} from "../../capability/capability.service";
import { MailService } from "../../../mail/mail.service";

describe("PointEarningService", () => {
  let service: PointEarningService;

  const mockStaffRepository = { findOne: jest.fn() };
  const mockBusinessRepository = { findOne: jest.fn() };
  const mockParticipantRepository = { findOne: jest.fn() };
  const mockParticipantCampaignBalanceRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const mockCampaignRepository = { findOne: jest.fn() };
  const mockBusinessCampaignRepository = { findOne: jest.fn() };
  const mockPointHistoryRepository = { create: jest.fn() };
  const mockDataSource = { transaction: jest.fn() };
  const mockMailService = {
    sendPointsEarnedEmail: jest.fn(),
    sendBusinessActivityEmail: jest.fn(),
  };
  const mockCapabilityService = { checkPermission: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointEarningService,
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepository },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(ParticipantCampaignBalance),
          useValue: mockParticipantCampaignBalanceRepository,
        },
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(BusinessCampaign),
          useValue: mockBusinessCampaignRepository,
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: mockPointHistoryRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: MailService, useValue: mockMailService },
        { provide: CapabilityService, useValue: mockCapabilityService },
      ],
    }).compile();

    service = module.get<PointEarningService>(PointEarningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("awardPoints", () => {
    const staff = { id: "staff-id", business: { id: "business-id" } } as Staff;
    const participant = {
      id: "participant-id",
      global_total_points: 0,
    } as Participant;
    const businessCampaign = {
      id: "campaign-id",
      business: { id: "business-id" },
      reward_type: "regular",
      regular_points_threshold: 100,
      total_points_earned: 90,
    } as BusinessCampaign;

    it("should award points successfully (happy path)", async () => {
      mockStaffRepository.findOne.mockResolvedValue(staff);
      const mockManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === Participant) return participant;
          if (entity === BusinessCampaign)
            return { ...businessCampaign, total_points_earned: 0 };
          if (entity === ParticipantCampaignBalance) return null;
          return null;
        }),
        save: jest.fn().mockResolvedValue(true),
      };
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockManager),
      );
      mockParticipantCampaignBalanceRepository.create.mockReturnValue({
        participant,
        campaign_balance: 0,
        businessCampaign,
      });
      mockPointHistoryRepository.create.mockReturnValue({});

      await service.awardPoints(
        "staff-id",
        "Staff",
        "participant-id",
        "campaign-id",
        50,
      );

      expect(mockCapabilityService.checkPermission).toHaveBeenCalledWith(
        "business-id",
        ActionType.AWARD_POINTS,
        { points: 50 },
      );
      expect(mockManager.save).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if monthly points allowance is exceeded", async () => {
      mockStaffRepository.findOne.mockResolvedValue(staff);
      mockCapabilityService.checkPermission.mockRejectedValue(
        new Error("ForbiddenException"),
      ); // Mocking the exception

      const mockManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === Participant) return participant;
          if (entity === BusinessCampaign)
            return { ...businessCampaign, total_points_earned: 0 };
          return null;
        }),
      };
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockManager),
      );

      await expect(
        service.awardPoints(
          "staff-id",
          "Staff",
          "participant-id",
          "campaign-id",
          50,
        ),
      ).rejects.toThrow();
    });

    it("should throw BadRequestException if regular points threshold is reached", async () => {
      mockStaffRepository.findOne.mockResolvedValue(staff);

      const campaignAtThreshold = {
        ...businessCampaign,
        total_points_earned: 100,
      };
      const mockManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === Participant) return participant;
          if (entity === BusinessCampaign) return campaignAtThreshold;
          return null;
        }),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockManager),
      );

      await expect(
        service.awardPoints(
          "staff-id",
          "Staff",
          "participant-id",
          "campaign-id",
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if matching points threshold is reached", async () => {
      mockStaffRepository.findOne.mockResolvedValue(staff);
      const campaignAtThreshold = {
        ...businessCampaign,
        reward_type: "matching",
        matching_points_threshold: 100,
        total_matching_points_earned: 100,
      };
      const mockManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === Participant) return participant;
          if (entity === BusinessCampaign) return campaignAtThreshold;
          return null;
        }),
        save: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockManager),
      );

      await expect(
        service.awardPoints(
          "staff-id",
          "Staff",
          "participant-id",
          "campaign-id",
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if matching points are disabled by admin", async () => {
      mockStaffRepository.findOne.mockResolvedValue(staff);
      const disabledCampaign = {
        ...businessCampaign,
        reward_type: "matching",
        matching_points_disabled_by_admin: true,
      };
      const mockManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === Participant) return participant;
          if (entity === BusinessCampaign) return disabledCampaign;
          return null;
        }),
        save: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockManager),
      );

      await expect(
        service.awardPoints(
          "staff-id",
          "Staff",
          "participant-id",
          "campaign-id",
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
