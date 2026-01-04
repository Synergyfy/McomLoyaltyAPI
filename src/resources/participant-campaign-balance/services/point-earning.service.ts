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
import { StampService } from "../../stamp/services/stamp.service";
import { StampTriggerMethod } from "../../stamp/enums/stamp-trigger-method.enum";
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
    private readonly stampService: StampService,
    private readonly notificationService: NotificationService,
  ) { }

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
    participantId: string,
    campaignId: string,
    points: number,
    sourceDescription?: string,
    transactionManager?: any, // EntityManager
  ): Promise<Participant> {
    // 1. Velocity Check (Outside Transaction for speed, tolerant to race)
    const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);
    const recentTxCount = await this.pointHistoryRepository.count({
      where: {
        participant: { id: participantId },
        created_at: MoreThan(ONE_MINUTE_AGO),
      },
    });

    if (recentTxCount >= 10) {
      // Limit: 10 tx per minute
      throw new BadRequestException(
        "Transaction limit exceeded. Please try again later.",
      );
    }

    const notificationsToSend: Array<() => Promise<void>> = [];

    const execute = async (manager: EntityManager) => {
      const { staff, business } = await this.findPerformer(
        performerId,
        performerType,
      );

      // Lock Participant? Or just Balance?
      // Locking Balance is better. But if new, we can't lock.
      // We can lock Participant to serialize operations for this user.
      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
        lock: { mode: "pessimistic_write" }, // Serializes all point updates for this user
      });
      if (!participant) {
        throw new NotFoundException("Participant not found");
      }

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ["business", "campaign", "businessRewards"],
      });

      if (!businessCampaign) {
        throw new NotFoundException("Business campaign not found");
      }

      const activeCampaign = businessCampaign;

      // Check if business matches
      if (businessCampaign && businessCampaign.business.id !== business.id) {
        throw new BadRequestException(
          "This campaign does not belong to the performing business",
        );
      }

      // Check Reward Mode
      const isPointsEnabled =
        businessCampaign.reward_mode === CampaignRewardMode.POINTS ||
        businessCampaign.reward_mode === CampaignRewardMode.BOTH ||
        businessCampaign.businessRewards?.some((r) => r.is_points_enabled);

      if (!isPointsEnabled) {
        throw new BadRequestException(
          "This campaign only allows awarding stamps.",
        );
      }

      // Check Monthly Points Allowance
      await this.capabilityService.checkPermission(
        business.id,
        ActionType.AWARD_POINTS,
        { points },
      );

      // Enforce Monthly Point Limit and Deduction Logic
      const membership = await this.membershipService.findOneByBusinessId(
        business.id,
      );
      if (membership && membership.tier && membership.tier.configuration) {
        const monthlyAllowance =
          membership.tier.configuration.quotas.monthlyPointsAllowance;

        // Calculate points used this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const pointsUsedResult = await manager
          .createQueryBuilder(PointHistory, "pointHistory") // Use manager for consistency
          .where("pointHistory.business_id = :businessId", {
            businessId: business.id,
          })
          .andWhere("pointHistory.created_at >= :startOfMonth", {
            startOfMonth,
          })
          .andWhere("pointHistory.type IN (:...types)", {
            types: ["EARN", "MATCHING"],
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

        // Notification: 80% Allowance Warning (Prepare, don't send yet)
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

        // 1. Deduct from Monthly Allowance
        if (remainingMonthlyAllowance >= pointsToDeduct) {
          // Covered by monthly allowance
          pointsToDeduct = 0;
        } else {
          pointsToDeduct -= remainingMonthlyAllowance;
        }

        // 2. Deduct from Legacy Extra Points & Packages
        if (pointsToDeduct > 0) {
          const totalLegacyLimit =
            monthlyAllowance + (business.extraPoints || 0);
          const legacyDeficit = pointsUsed + points - totalLegacyLimit;

          if (legacyDeficit > 0) {
            // We need to cover `legacyDeficit` from packages.
            await this.pointPackageService.deductPoints(
              business.id,
              legacyDeficit,
              manager,
            );
          }
        }
      }

      if (
        (activeCampaign.reward_type === "matching" ||
          activeCampaign.reward_type === "both") &&
        activeCampaign.matching_points_disabled_by_admin
      ) {
        throw new BadRequestException(
          "Matching points awards are currently disabled for this campaign.",
        );
      }

      if (
        activeCampaign.reward_type === "regular" ||
        activeCampaign.reward_type === "both"
      ) {
        if (
          activeCampaign.regular_points_threshold !== null &&
          activeCampaign.total_points_earned + points >
          activeCampaign.regular_points_threshold
        ) {
          throw new BadRequestException(
            "Campaign regular points threshold reached.",
          );
        }

        const whereCondition: any = { participant: { id: participantId } };
        if (businessCampaign) {
          whereCondition.businessCampaign = { id: campaignId };
        }

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

          if (businessCampaign) {
            participantCampaignBalance.businessCampaign = businessCampaign;
            if (businessCampaign.campaign) {
              participantCampaignBalance.campaign = businessCampaign.campaign;
            }
          }
        }
        participantCampaignBalance.campaign_balance += points;

        // Prepare Notification: Campaign Joined
        if (isNewJoin) {
          notificationsToSend.push(async () => {
            try {
              await this.notificationService.create(
                "New Campaign Joined",
                `Participant ${participant.name} has joined campaign ${businessCampaign ? businessCampaign.name : "Unknown"}.`,
                NotificationType.CAMPAIGN_JOINED,
                NotificationRecipientType.BUSINESS,
                business.id,
                campaignId,
              );

              if (businessCampaign && businessCampaign.business) {
                await this.mailService.sendBusinessActivityEmail(
                  businessCampaign.business.email,
                  "JOIN",
                  0,
                  participant.name,
                  "System",
                  businessCampaign.name,
                  "Participant joined the campaign",
                );
              }
            } catch (e) {
              console.error("Failed to send campaign join notification:", e);
            }
          });
        }

        participant.global_total_points += points;
        activeCampaign.total_points_earned += points;

        // Update business totals
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
        });

        if (businessCampaign) {
          regularPointHistory.businessCampaign = businessCampaign;
          if (businessCampaign.campaign) {
            regularPointHistory.campaign = businessCampaign.campaign;
          }
        }

        await manager.save(regularPointHistory);

        // Prepare Notifications: Point Awarded
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
          } catch (e) {
            console.error(e);
          }

          try {
            await this.notificationService.create(
              "Points Received",
              `You received ${points} points from ${business.name}.`,
              NotificationType.POINT_AWARDED,
              NotificationRecipientType.USER,
              participant.id,
              campaignId,
            );
          } catch (e) {
            console.error(e);
          }

          // Emails
          const businessOwner = businessCampaign.business;
          try {
            await this.mailService.sendPointsEarnedEmail(
              participant.email,
              points,
              business.name,
              businessCampaign.name,
              participantCampaignBalance.campaign_balance,
            );
          } catch (error) {
            console.error(
              "Failed to send points earned email to participant:",
              error,
            );
          }

          if (businessOwner) {
            try {
              await this.mailService.sendBusinessActivityEmail(
                businessOwner.email,
                "EARN",
                points,
                participant.name,
                staff ? staff.name : business.name,
                businessCampaign.name,
                sourceDescription || "Points Awarded",
              );
            } catch (error) {
              console.error(
                "Failed to send activity email to business owner:",
                error,
              );
            }
          }
        });
      }

      if (
        activeCampaign.reward_type === "matching" ||
        activeCampaign.reward_type === "both"
      ) {
        if (
          activeCampaign.matching_points_threshold !== null &&
          activeCampaign.total_matching_points_earned + points >
          activeCampaign.matching_points_threshold
        ) {
          throw new BadRequestException(
            "Campaign matching points threshold reached.",
          );
        }

        participant.matching_points += points;
        activeCampaign.total_matching_points_earned += points;

        const matchingPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.MATCHING,
          points,
          participant,
          initiated_by_staff: staff,
          business: business,
          description:
            sourceDescription ||
            `Matching points for campaign: ${activeCampaign.name} `,
        });

        if (businessCampaign) {
          matchingPointHistory.businessCampaign = businessCampaign;
          if (businessCampaign.campaign) {
            matchingPointHistory.campaign = businessCampaign.campaign;
          }
        }

        await manager.save(matchingPointHistory);
      }

      await manager.save(participant);
      if (businessCampaign) {
        await manager.save(BusinessCampaign, businessCampaign);
      }

      return participant;
    };

    let result: Participant;

    if (transactionManager) {
      result = await execute(transactionManager);
    } else {
      result = await this.dataSource.transaction(execute);

      // Post-transaction tasks
      try {
        let businessId = "";
        if (performerType === "Business") {
          businessId = performerId;
        } else {
          const staff = await this.staffRepository.findOne({
            where: { id: performerId },
            relations: ["business"],
          });
          if (staff && staff.business) businessId = staff.business.id;
        }

        if (businessId) {
          await this.tierProgressionService.checkAndPromote(businessId);
        }
      } catch (e) {
        console.error("Error checking promotion:", e);
      }
    }

    // Execute side effects (notifications/emails)
    // We do this async and don't await to avoid blocking response, or await if critical.
    // Usually best to not block response if possible, but for consistent UX (errors in logs), we can fire and forget.
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
    triggerMethod: StampTriggerMethod = StampTriggerMethod.MANUAL,
    transactionManager?: any,
  ): Promise<any> {
    const execute = async (manager: any) => {
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
        relations: [
          "business",
          "businessStampReward",
          "businessStampReward.template",
          "businessRewards",
        ],
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

      if (!isStampsEnabled) {
        throw new BadRequestException(
          "This campaign only allows awarding points.",
        );
      }

      // Check Quota and Packages
      try {
        await this.capabilityService.checkPermission(
          business.id,
          ActionType.AWARD_STAMPS,
          { stamps },
        );
      } catch (e) {
        if (e instanceof ForbiddenException) {
          // Monthly quota exceeded, deduct from packages
          await this.stampPackageService.deductStamps(
            business.id,
            stamps,
            manager,
          );
        } else {
          throw e;
        }
      }

      // Award Stamps via StampService (if template exists)
      let card = null;
      if (businessCampaign.businessStampReward) {
        card = await this.stampService.processAddStamp(
          participant,
          businessCampaign.businessStampReward,
          triggerMethod,
          sourceDescription || "Awarded manually",
        );
      }

      // --- NEW: Update Campaign Stamp Balance and Log History ---
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
      await manager.save(ParticipantCampaignBalance, participantCampaignBalance);

      const stampHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.STAMP_EARN,
        points: 0, // No points for stamp earn history
        stamps: stamps,
        participant,
        initiated_by_staff: staff,
        business: business,
        businessCampaign: businessCampaign,
        campaign: businessCampaign.campaign,
        description: sourceDescription || "Stamps Awarded",
      });

      await manager.save(stampHistory);
      // ----------------------------------------------------------

      // Notifications
      try {
        await this.notificationService.create(
          "Stamps Awarded",
          `You earned a stamp from ${business.name} !`,
          NotificationType.STAMP_AWARDED,
          NotificationRecipientType.USER,
          participant.id,
        );

        await this.mailService.sendStampEarnedEmail(
          participant.email,
          stamps,
          business.name,
          businessCampaign.name,
          card ? card.current_stamps : participantCampaignBalance.stamp_balance,
        );
      } catch (error) {
        console.error("Failed to send stamp notifications:", error);
      }

      return card || participantCampaignBalance;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return this.dataSource.transaction(execute);
    }
  }

  // Method A: Staff/Business scans Participant
  async awardPointsByScan(
    performerId: string,
    performerType: "Staff" | "Business",
    participantCode: string,
    campaignId: string,
    points: number,
  ) {
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    return this.awardPoints(
      performerId,
      performerType,
      participant.id,
      campaignId,
      points,
      "Awarded by scan",
    );
  }

  // Method C: Dual Code
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
    if (!participant) throw new NotFoundException("Participant not found");

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? "Staff" : "Business";

    return this.awardPoints(
      performerId,
      performerType,
      participant.id,
      campaignId,
      points,
      "Awarded by dual scan",
    );
  }

  async awardStampsByScan(
    performerId: string,
    performerType: "Staff" | "Business",
    participantCode: string,
    campaignId: string,
    stamps: number = 1,
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
