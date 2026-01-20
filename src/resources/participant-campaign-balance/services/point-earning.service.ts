import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, EntityManager } from "typeorm";
import { Staff } from "../../staff/entities/staff.entity";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../entities/participant-campaign-balance.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../entities/point-history.entity";
import { DataSource } from "typeorm";
import { MailService } from "../../../mail/mail.service";
import {
  ActionType,
  CapabilityService,
} from "../../capability/capability.service";
import { CampaignRewardMode } from "../../campaign/entities/campaign-enums";
import { TierProgressionService } from "../../tier-progression/tier-progression.service";
import { MembershipService } from "../../membership/membership.service";
import { PointPackageService } from "../../point-package/point-package.service";
import { StampPackageService } from "../../stamp/services/stamp-package.service";
import { NotificationService } from "../../notification/notification.service";
import {
  NotificationType,
  NotificationRecipientType,
} from "../../notification/enums/notification-type.enum";

@Injectable()
export class PointEarningService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly capabilityService: CapabilityService,
    private readonly tierProgressionService: TierProgressionService,
    private readonly membershipService: MembershipService,
    private readonly pointPackageService: PointPackageService,
    private readonly stampPackageService: StampPackageService,
    private readonly notificationService: NotificationService,
  ) {}

  // Helper to find performer (Staff or Business)
  private async findPerformer(id: string, type: "Staff" | "Business") {
    if (type === "Staff") {
      const staff = await this.staffRepository.findOne({
        where: { id },
        relations: ["business"],
      });
      if (!staff) throw new NotFoundException("Staff not found");
      return { staff, business: staff.business };
    } else {
      const business = await this.businessRepository.findOne({ where: { id } });
      if (!business) throw new NotFoundException("Business not found");
      return { staff: null, business };
    }
  }

  // Helper to find performer by unique code
  private async findPerformerByCode(code: string) {
    const staff = await this.staffRepository.findOne({
      where: { uniqueCode: code },
      relations: ["business"],
    });
    if (staff) return { staff, business: staff.business };

    const business = await this.businessRepository.findOne({
      where: { uniqueCode: code },
    });
    if (business) return { staff: null, business };

    throw new NotFoundException("Invalid staff or business code");
  }

  async awardPoints(
    performerId: string,
    performerType: "Staff" | "Business",
    recipientId: string,
    campaignId: string,
    points: number,
    sourceDescription?: string,
    transactionManager?: EntityManager,
    idempotencyKey?: string,
  ): Promise<Participant> {
    // 1. Velocity Check (Outside Transaction for speed, tolerant to race)
    const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);
    const recentTxCount = await this.pointHistoryRepository.count({
      where: {
        participant: { id: recipientId },
        created_at: MoreThan(ONE_MINUTE_AGO),
      },
    });

    if (recentTxCount >= 10) {
      throw new BadRequestException(
        "Transaction limit exceeded. Please try again later.",
      );
    }

    const notificationsToSend: Array<() => Promise<void>> = [];

    const execute = async (manager: EntityManager) => {
      // Idempotency Check
      if (idempotencyKey) {
        const existingHistory = await manager.findOne(PointHistory, {
          where: { actionKey: idempotencyKey },
          relations: ["participant"],
        });

        if (existingHistory && existingHistory.participant) {
          return existingHistory.participant;
        }
      }

      const { staff, business } = await this.findPerformer(
        performerId,
        performerType,
      );

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ["business", "campaign", "businessRewards"],
      });

      if (!businessCampaign) {
        throw new NotFoundException("Business campaign not found");
      }

      const activeCampaign = businessCampaign;

      if (businessCampaign.business.id !== business.id) {
        throw new BadRequestException(
          "This campaign does not belong to the performing business",
        );
      }

      const isPointsEnabled =
        businessCampaign.reward_mode === CampaignRewardMode.POINTS ||
        businessCampaign.reward_mode === CampaignRewardMode.BOTH ||
        businessCampaign.businessRewards?.some((r) => r.is_points_enabled);

      if (!isPointsEnabled) {
        throw new BadRequestException(
          "This campaign only allows awarding stamps.",
        );
      }

      await this.capabilityService.checkPermission(
        business.id,
        ActionType.AWARD_POINTS,
        { points },
      );

      const membership = await this.membershipService.findOneByBusinessId(
        business.id,
      );
      if (membership && membership.tier && membership.tier.configuration) {
        const monthlyAllowance =
          membership.tier.configuration.quotas.monthlyPointsAllowance;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const pointsUsedResult = await manager
          .createQueryBuilder(PointHistory, "pointHistory")
          .where("pointHistory.business_id = :businessId", {
            businessId: business.id,
          })
          .andWhere("pointHistory.created_at >= :startOfMonth", {
            startOfMonth,
          })
          .andWhere("pointHistory.type IN (:...types)", {
            types: ["EARN"],
          })
          .select("SUM(pointHistory.points)", "total")
          .getRawOne();

        const pointsUsed =
          pointsUsedResult && pointsUsedResult.total
            ? Number(pointsUsedResult.total)
            : 0;
        const remainingMonthlyAllowance = Math.max(
          0,
          monthlyAllowance - pointsUsed,
        );

        const usageRatioBefore = pointsUsed / monthlyAllowance;
        const usageRatioAfter = (pointsUsed + points) / monthlyAllowance;
        if (usageRatioBefore < 0.8 && usageRatioAfter >= 0.8) {
          notificationsToSend.push(async () => {
            try {
              await this.notificationService.create(
                "Point Allowance Warning",
                `You have used over 80 % of your monthly point allowance(${Math.round(usageRatioAfter * 100)} %).`,
                NotificationType.ALLOWANCE_WARNING,
                NotificationRecipientType.BUSINESS,
                business.id,
              );

              await this.mailService.sendBusinessActivityEmail(
                business.email,
                "ALLOWANCE_WARNING",
                0,
                "System",
                "System",
                "N/A",
                `You have used over 80 % of your monthly point allowance.`,
              );
            } catch (e) {
              console.error("Failed to send allowance warning:", e);
            }
          });
        }

        let pointsToDeduct = points;
        if (remainingMonthlyAllowance >= pointsToDeduct) {
          pointsToDeduct = 0;
        } else {
          pointsToDeduct -= remainingMonthlyAllowance;
        }

        if (pointsToDeduct > 0) {
          const totalLegacyLimit =
            monthlyAllowance + (business.extraPoints || 0);
          const legacyDeficit = pointsUsed + points - totalLegacyLimit;

          if (legacyDeficit > 0) {
            await this.pointPackageService.deductPoints(
              business.id,
              legacyDeficit,
              manager,
            );
          }
        }
      }

      const participant = await manager.findOne(Participant, {
        where: { id: recipientId },
        lock: { mode: "pessimistic_write" },
      });
      if (!participant) {
        throw new NotFoundException("Participant not found");
      }

      if (points > 0) {
        if (
          activeCampaign.regular_points_threshold !== null &&
          activeCampaign.total_points_earned + points >
            activeCampaign.regular_points_threshold
        ) {
          throw new BadRequestException(
            "Campaign regular points threshold reached.",
          );
        }

        const whereCondition: any = {
          participant: { id: recipientId },
          businessCampaign: { id: campaignId },
        };

        let participantCampaignBalance = await manager.findOne(
          ParticipantCampaignBalance,
          {
            where: whereCondition,
          },
        );

        let isNewJoin = false;
        if (!participantCampaignBalance) {
          participantCampaignBalance =
            this.participantCampaignBalanceRepository.create({
              participant,
              campaign_balance: 0,
            });
          isNewJoin = true;
          participantCampaignBalance.businessCampaign = businessCampaign;
          if (businessCampaign.campaign) {
            participantCampaignBalance.campaign = businessCampaign.campaign;
          }
        }
        participantCampaignBalance.campaign_balance += points;

        if (isNewJoin) {
          notificationsToSend.push(async () => {
            try {
              await this.notificationService.create(
                "New Campaign Joined",
                `Participant ${participant.name} has joined campaign ${businessCampaign.name}.`,
                NotificationType.CAMPAIGN_JOINED,
                NotificationRecipientType.BUSINESS,
                business.id,
                campaignId,
              );

              await this.mailService.sendBusinessActivityEmail(
                businessCampaign.business.email,
                "JOIN",
                0,
                participant.name,
                "System",
                businessCampaign.name,
                "Participant joined the campaign",
              );
            } catch (e) {
              console.error("Failed to send campaign join notification:", e);
            }
          });
        }

        participant.global_total_points += points;
        activeCampaign.total_points_earned += points;

        if (businessCampaign.business) {
          businessCampaign.business.total_points_earned += points;
          await manager.save(businessCampaign.business);
        }

        await manager.save(participantCampaignBalance);

        const regularPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.EARN,
          points,
          participant,
          initiated_by_staff: staff,
          business: business,
          description: sourceDescription,
          actionKey: idempotencyKey,
        });

        regularPointHistory.businessCampaign = businessCampaign;
        if (businessCampaign.campaign) {
          regularPointHistory.campaign = businessCampaign.campaign;
        }

        await manager.save(regularPointHistory);

        notificationsToSend.push(async () => {
          try {
            await this.notificationService.create(
              "Points Awarded",
              `You awarded ${points} points to ${participant.name}.`,
              NotificationType.POINT_AWARDED,
              NotificationRecipientType.BUSINESS,
              business.id,
              campaignId,
            );
            await this.notificationService.create(
              "Points Received",
              `You received ${points} points from ${business.name}.`,
              NotificationType.POINT_AWARDED,
              NotificationRecipientType.USER,
              participant.id,
              campaignId,
            );
            await this.mailService.sendPointsEarnedEmail(
              participant.email,
              points,
              business.name,
              businessCampaign.name,
              participantCampaignBalance.campaign_balance,
            );
            await this.mailService.sendBusinessActivityEmail(
              businessCampaign.business.email,
              "EARN",
              points,
              participant.name,
              staff ? staff.name : business.name,
              businessCampaign.name,
              sourceDescription || "Points Awarded",
            );
          } catch (error) {
            console.error("Error sending notifications/emails:", error);
          }
        });
      }

      await manager.save(participant);
      await manager.save(BusinessCampaign, businessCampaign);

      return participant;
    };

    let result: Participant;
    if (transactionManager) {
      result = await execute(transactionManager);
    } else {
      result = await this.dataSource.transaction(execute);
      try {
        const { business } = await this.findPerformer(
          performerId,
          performerType,
        );
        await this.tierProgressionService.checkAndPromote(business.id);
      } catch (e) {
        console.error("Error checking promotion:", e);
      }
    }

    Promise.all(notificationsToSend.map((fn) => fn())).catch((e) =>
      console.error("Notification error", e),
    );

    return result;
  }

  async awardStamps(
    performerId: string,
    performerType: "Staff" | "Business",
    participantId: string,
    campaignId: string,
    stamps: number = 1,
    sourceDescription?: string,
    transactionManager?: EntityManager,
    idempotencyKey?: string,
  ): Promise<ParticipantCampaignBalance> {
    const execute = async (manager: EntityManager) => {
      if (idempotencyKey) {
        const existingHistory = await manager.findOne(PointHistory, {
          where: { actionKey: idempotencyKey },
          relations: ["participant"],
        });

        if (existingHistory) {
          const balance = await manager.findOne(ParticipantCampaignBalance, {
            where: {
              participant: { id: participantId },
              businessCampaign: { id: campaignId },
            },
          });
          if (balance) return balance;
        }
      }

      const { staff, business } = await this.findPerformer(
        performerId,
        performerType,
      );

      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
      });
      if (!participant) throw new NotFoundException("Participant not found");

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ["business", "campaign", "businessRewards"],
      });

      if (!businessCampaign)
        throw new NotFoundException("Business campaign not found");

      if (businessCampaign.business.id !== business.id) {
        throw new BadRequestException(
          "This campaign does not belong to the performing business",
        );
      }

      const isStampsEnabled =
        businessCampaign.reward_mode === CampaignRewardMode.STAMPS ||
        businessCampaign.reward_mode === CampaignRewardMode.BOTH ||
        businessCampaign.businessRewards?.some((r) => r.is_stamps_enabled);

      if (!isStampsEnabled) {
        throw new BadRequestException(
          "This campaign only allows awarding points.",
        );
      }

      try {
        await this.capabilityService.checkPermission(
          business.id,
          ActionType.AWARD_STAMPS,
          { stamps },
        );
      } catch (e) {
        if (e instanceof ForbiddenException) {
          await this.stampPackageService.deductStamps(
            business.id,
            stamps,
            manager,
            {
              participantId: participant.id,
              campaignId: campaignId,
              description: sourceDescription || "Stamps Awarded (Package)",
            },
          );
        } else {
          throw e;
        }
      }

      let participantCampaignBalance = await manager.findOne(
        ParticipantCampaignBalance,
        {
          where: {
            participant: { id: participant.id },
            businessCampaign: { id: campaignId },
          },
        },
      );

      if (!participantCampaignBalance) {
        participantCampaignBalance = manager.create(
          ParticipantCampaignBalance,
          {
            participant,
            businessCampaign,
            campaign: businessCampaign.campaign,
            stamp_balance: 0,
            campaign_balance: 0,
          },
        );
      }

      participantCampaignBalance.stamp_balance += stamps;
      await manager.save(
        ParticipantCampaignBalance,
        participantCampaignBalance,
      );

      const stampHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.STAMP_EARN,
        points: 0,
        stamps: stamps,
        participant,
        initiated_by_staff: staff,
        business: business,
        businessCampaign: businessCampaign,
        campaign: businessCampaign.campaign,
        description: sourceDescription || "Stamps Awarded",
        actionKey: idempotencyKey,
      });

      await manager.save(PointHistory, stampHistory);

      try {
        await this.notificationService.create(
          "Stamps Awarded",
          `You earned ${stamps} stamp(s) from ${business.name} !`,
          NotificationType.STAMP_AWARDED,
          NotificationRecipientType.USER,
          participant.id,
        );

        await this.mailService.sendStampEarnedEmail(
          participant.email,
          stamps,
          business.name,
          businessCampaign.name,
          participantCampaignBalance.stamp_balance,
        );
      } catch (error) {
        console.error("Failed to send stamp notifications:", error);
      }

      return participantCampaignBalance;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return this.dataSource.transaction(execute);
    }
  }

  async awardPointsByScan(
    performerId: string,
    performerType: "Staff" | "Business",
    recipientCode: string,
    campaignId: string,
    points: number,
    idempotencyKey?: string,
  ) {
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: recipientCode },
    });

    if (participant) {
      return this.awardPoints(
        performerId,
        performerType,
        participant.id,
        campaignId,
        points,
        "Awarded by scan",
        undefined,
        idempotencyKey,
      );
    }

    throw new NotFoundException("Participant not found");
  }

  async awardPointsDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    campaignId: string,
    points: number,
  ) {
    const { staff, business } =
      await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? "Staff" : "Business";

    if (participant) {
      return this.awardPoints(
        performerId,
        performerType,
        participant.id,
        campaignId,
        points,
        "Awarded by dual scan",
      );
    }
    throw new NotFoundException("Participant not found");
  }

  async awardStampsByScan(
    performerId: string,
    performerType: "Staff" | "Business",
    participantCode: string,
    campaignId: string,
    stamps: number = 1,
    idempotencyKey?: string,
  ) {
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    return this.awardStamps(
      performerId,
      performerType,
      participant.id,
      campaignId,
      stamps,
      "Awarded by stamp scan",
      undefined,
      idempotencyKey,
    );
  }

  async awardStampsDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    campaignId: string,
    stamps: number = 1,
  ) {
    const { staff, business } =
      await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? "Staff" : "Business";

    return this.awardStamps(
      performerId,
      performerType,
      participant.id,
      campaignId,
      stamps,
      "Awarded by stamp dual scan",
    );
  }
}
