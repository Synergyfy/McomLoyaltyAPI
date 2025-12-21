import { Test, TestingModule } from "@nestjs/testing";
import { ParticipantCampaignBalanceController } from "./participant-campaign-balance.controller";
import { RedemptionService } from "./services/redemption.service";
import { PointEarningService } from "./services/point-earning.service";
import { ParticipantCampaignBalanceService } from "./services/participant-campaign-balance.service";
import { TransactionCodeService } from "./services/transaction-code.service";
import { TransactionType } from "./entities/transaction-code.entity";
import { Role } from "../../common/role.enum";

describe("ParticipantCampaignBalanceController", () => {
  let controller: ParticipantCampaignBalanceController;
  let pointEarningService: PointEarningService;
  let redemptionService: RedemptionService;
  let transactionCodeService: TransactionCodeService;
  let participantCampaignBalanceService: ParticipantCampaignBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantCampaignBalanceController],
      providers: [
        {
          provide: RedemptionService,
          useValue: {
            redeemReward: jest.fn(),
            redeemRewardByScan: jest.fn(),
            redeemRewardDualScan: jest.fn(),
          },
        },
        {
          provide: PointEarningService,
          useValue: {
            awardPoints: jest.fn(),
            awardPointsByScan: jest.fn(),
            awardPointsDualScan: jest.fn(),
          },
        },
        {
          provide: ParticipantCampaignBalanceService,
          useValue: {
            getParticipantBalance: jest.fn(),
            getParticipantBalanceForCampaign: jest.fn(),
            claimCode: jest.fn(),
            isJoined: jest.fn(),
          },
        },
        {
          provide: TransactionCodeService,
          useValue: {
            generateCode: jest.fn(),
            getGeneratedCodes: jest.fn(),
            validateDualScanPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ParticipantCampaignBalanceController>(
      ParticipantCampaignBalanceController,
    );
    pointEarningService = module.get<PointEarningService>(PointEarningService);
    redemptionService = module.get<RedemptionService>(RedemptionService);
    transactionCodeService = module.get<TransactionCodeService>(
      TransactionCodeService,
    );
    participantCampaignBalanceService =
      module.get<ParticipantCampaignBalanceService>(
        ParticipantCampaignBalanceService,
      );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("scanParticipant", () => {
    it("should call awardPointsByScan for EARN type", async () => {
      const user = { id: "user1", role: Role.Staff } as any;
      const dto = {
        participantCode: "P12345678",
        campaignId: "camp1",
        points: 100,
        type: TransactionType.EARN,
      };

      await controller.scanParticipant(user, dto);

      expect(pointEarningService.awardPointsByScan).toHaveBeenCalledWith(
        "user1",
        "Staff",
        dto.participantCode,
        dto.campaignId,
        dto.points,
      );
    });

    it("should call redeemRewardByScan for REDEEM type", async () => {
      const user = { id: "user1", role: Role.Business } as any;
      const dto = {
        participantCode: "P12345678",
        campaignId: "camp1",
        rewardId: "reward1",
        type: TransactionType.REDEEM,
      };

      await controller.scanParticipant(user, dto);

      expect(redemptionService.redeemRewardByScan).toHaveBeenCalledWith(
        "user1",
        "Business",
        dto.participantCode,
        dto.rewardId,
        dto.campaignId,
        null,
      );
    });
  });

  describe("claimCode", () => {
    it("should call claimCode service method", async () => {
      const user = { id: "part1", role: Role.Participant } as any;
      const dto = { code: "CODE123", campaignId: "camp1" };

      await controller.claimCode(user, dto);

      expect(participantCampaignBalanceService.claimCode).toHaveBeenCalledWith(
        user.id,
        dto.code,
        dto.campaignId,
      );
    });
  });

  describe("dualScan", () => {
    it("should call validateDualScanPermission", async () => {
      const user = { id: "user1", role: Role.Staff } as any;
      const dto = {
        staffOrBusinessCode: "CODE123",
        participantCode: "P12345678",
        campaignId: "camp1",
        points: 100,
        type: TransactionType.EARN,
      };

      await controller.dualScan(user, dto);

      expect(
        transactionCodeService.validateDualScanPermission,
      ).toHaveBeenCalledWith(user, dto.staffOrBusinessCode);
      expect(pointEarningService.awardPointsDualScan).toHaveBeenCalled();
    });
  });

  describe("isJoined", () => {
    it("should call isJoined service method", async () => {
      const user = { id: "part1", role: Role.Participant } as any;
      const dto = { campaignId: "camp1" };

      await controller.isJoined(user, dto);

      expect(participantCampaignBalanceService.isJoined).toHaveBeenCalledWith(
        user.id,
        dto.campaignId,
      );
    });
  });
});
