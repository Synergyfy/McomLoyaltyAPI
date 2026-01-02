import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Staff } from "../../staff/entities/staff.entity";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { BusinessReward } from "../../rewards/entities/business-reward.entity";
import { ParticipantCampaignBalance } from "../entities/participant-campaign-balance.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../entities/point-history.entity";
import { DataSource } from "typeorm";
import { MailService } from "../../../mail/mail.service";
import { NotificationService } from "../../notification/notification.service";
import {
  NotificationType,
  NotificationRecipientType,
} from "../../notification/enums/notification-type.enum";
import { WalletService } from "../../wallet/wallet.service";
import { MallIntegrationService } from "../../mall-integration/mall-integration.service";

@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly walletService: WalletService,
    private readonly mallIntegrationService: MallIntegrationService,
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

  async redeemReward(
    performerId: string,
    performerType: "Staff" | "Business" | "Participant",
    participantId: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null,
    sourceDescription?: string,
    redemptionMethod: "points" | "stamps" = "points",
    transactionManager?: any, // EntityManager
  ): Promise<ParticipantCampaignBalance> {
    const execute = async (manager: any) => {
      let staff: Staff | null = null;
      let business: Business | null = null;

      if (performerType === "Participant") {
        if (performerId !== participantId) {
          throw new BadRequestException(
            "You can only redeem rewards for yourself.",
          );
        }
      } else {
        const performer = await this.findPerformer(
          performerId,
          performerType as "Staff" | "Business",
        );
        staff = performer.staff;
        business = performer.business;
      }

      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
      });
      if (!participant) {
        throw new NotFoundException("Participant not found");
      }

      let businessReward = await manager.findOne(BusinessReward, {
        where: { id: rewardId },
        relations: ["reward", "business"],
      });

      let reward: Reward | null = null;
      if (businessReward) {
        reward = businessReward.reward;
      } else {
        reward = await manager.findOne(Reward, { where: { id: rewardId } });
      }

      if (!businessReward && !reward) {
        throw new NotFoundException("Reward not found");
      }

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ["business", "rewards", "campaign", "businessRewards"],
      });

      if (!businessCampaign) {
        throw new NotFoundException("Business campaign not found");
      }

      if (!business) {
        business = businessCampaign.business;
      }

      if (
        !businessCampaign.business ||
        business.id !== businessCampaign.business.id
      ) {
        throw new BadRequestException(
          "This campaign does not belong to the performing business",
        );
      }

      if (businessCampaign.disabled) {
        throw new BadRequestException("Campaign is not active");
      }

      let isRewardInCampaign = false;
      if (businessReward) {
        isRewardInCampaign = businessCampaign.businessRewards?.some(
          (br) => br.id === businessReward.id,
        );
        if (!isRewardInCampaign && reward) {
          isRewardInCampaign = businessCampaign.rewards.some(
            (r) => r.id === reward.id,
          );
        }
      } else if (reward) {
        isRewardInCampaign = businessCampaign.rewards.some(
          (r) => r.id === reward.id,
        );
      }

      if (!isRewardInCampaign) {
        throw new BadRequestException(
          "Reward is not available in this campaign",
        );
      }

      if (!businessReward && reward) {
        businessReward = await manager.findOne(BusinessReward, {
          where: {
            reward: { id: reward.id },
            business: { id: business.id },
          },
        });
      }

      let pointsCost = 0;
      let stampsCost = 0;

      if (redemptionMethod === "points") {
        if (businessReward && businessReward.points_required !== null) {
          pointsCost = businessReward.points_required;
        } else if (reward) {
          pointsCost = reward.max_points;
        }

        if (businessReward && !businessReward.is_points_enabled) {
          throw new BadRequestException(
            "Point redemption is disabled for this reward",
          );
        }
      } else {
        if (businessReward) {
          stampsCost = businessReward.stamps_required || 0;
          if (!businessReward.is_stamps_enabled) {
            throw new BadRequestException(
              "Stamp redemption is disabled for this reward",
            );
          }
        } else if (reward) {
          stampsCost = reward.max_stamps_required || 0;
          if (!reward.is_stamps_enabled) {
            throw new BadRequestException(
              "Stamp redemption is disabled for this reward",
            );
          }
        }

        if (stampsCost <= 0) {
          throw new BadRequestException(
            "Stamp cost not configured for this reward",
          );
        }
      }

      if (businessReward) {
        if (businessReward.remaining_quantity !== null) {
          if (businessReward.remaining_quantity <= 0) {
            throw new BadRequestException("Reward is out of stock");
          }
          businessReward.remaining_quantity -= 1;
          await manager.save(BusinessReward, businessReward);
        } else if (businessReward.quantity !== null) {
          const pastRedemptions = await manager.count(PointHistory, {
            where: {
              business: { id: business.id },
              businessReward: { id: businessReward.id },
              type: PointHistoryType.REDEEM,
            },
          });
          const currentRemaining = businessReward.quantity - pastRedemptions;
          if (currentRemaining <= 0) {
            throw new BadRequestException("Reward is out of stock");
          }
          businessReward.remaining_quantity = currentRemaining - 1;
          await manager.save(BusinessReward, businessReward);
        }
      }

      const participantCampaignBalance = await manager.findOne(
        ParticipantCampaignBalance,
        {
          where: {
            participant: { id: participantId },
            businessCampaign: { id: campaignId },
          },
        },
      );

      if (!participantCampaignBalance) {
        throw new BadRequestException(
          "Participant is not enrolled in this campaign",
        );
      }

      if (redemptionMethod === "points") {
        if (participantCampaignBalance.campaign_balance < pointsCost) {
          throw new BadRequestException("Not enough points");
        }
        participantCampaignBalance.campaign_balance -= pointsCost;
        participant.global_total_points -= pointsCost;
        businessCampaign.total_points_redeemed += pointsCost;

        if (businessCampaign.business) {
          businessCampaign.business.total_points_redeemed += pointsCost;
          await manager.save(businessCampaign.business);
        }
      } else {
        if (participantCampaignBalance.stamp_balance < stampsCost) {
          throw new BadRequestException("Not enough stamps");
        }
        participantCampaignBalance.stamp_balance -= stampsCost;
      }

      let voucherCode: string | undefined;
      if (
        businessReward &&
        businessReward.is_mall_integrated &&
        businessReward.mall_reward_value > 0
      ) {
        await this.walletService.spend(
          business.id,
          businessReward.mall_reward_value,
          `Reward Redemption: ${businessReward.title || (reward ? reward.title : "Reward")} (Participant: ${participant.name})`,
        );

        try {
          const amount = Number(businessReward.mall_reward_value);
          const payload = {
            amount: amount,
            recipientEmail: participant.email,
            recipientName: participant.name,
            message: `Congratulations! You redeemed ${businessReward.title || (reward ? reward.title : "Reward")} from ${business.name}.`,
            businessName: business.name,
          };

          let mallResponse: any;
          if (businessReward.mall_reward_type === "GIFT_CARD") {
            mallResponse =
              await this.mallIntegrationService.createGiftCard(payload);
          } else if (businessReward.mall_reward_type === "COUPON") {
            mallResponse =
              await this.mallIntegrationService.createCoupon(payload);
          } else {
            mallResponse =
              await this.mallIntegrationService.createVoucher(payload);
          }
          voucherCode = mallResponse.code;
        } catch (error) {
          console.error("Mall Integration Failed:", error);
          throw new BadRequestException(
            "Failed to generate external voucher. Please contact support or try again.",
          );
        }
      }

      const pointHistory = this.pointHistoryRepository.create({
        type:
          redemptionMethod === "points"
            ? PointHistoryType.REDEEM
            : PointHistoryType.STAMP_REDEEM,
        points: pointsCost,
        stamps: stampsCost,
        participant,
        reward: reward,
        initiated_by_staff: staff,
        business: business,
        redemption_code: voucherCode || redemptionCode,
        description: sourceDescription,
      });

      if (businessReward) {
        pointHistory.businessReward = businessReward;
      }

      pointHistory.businessCampaign = businessCampaign;
      if (businessCampaign.campaign) {
        pointHistory.campaign = businessCampaign.campaign;
      }

      await manager.save(participantCampaignBalance);
      await manager.save(participant);
      await manager.save(BusinessCampaign, businessCampaign);
      await manager.save(pointHistory);

      try {
        await this.notificationService.create(
          "Reward Redeemed",
          `Participant ${participant.name} redeemed reward ${businessReward?.title || reward?.title || "Reward"}.`,
          NotificationType.REWARD_REDEEMED,
          NotificationRecipientType.BUSINESS,
          business.id,
          campaignId,
        );
      } catch (e) {
        console.error(e);
      }

      try {
        await this.notificationService.create(
          "Reward Redeemed",
          `You redeemed reward ${businessReward?.title || reward?.title || "Reward"} at ${business.name}.`,
          NotificationType.REWARD_REDEEMED,
          NotificationRecipientType.USER,
          participant.id,
          campaignId,
        );
      } catch (e) {
        console.error(e);
      }

      try {
        await this.mailService.sendRewardRedeemedEmail(
          participant.email,
          businessReward?.title || reward?.title || "Reward",
          redemptionMethod === "points" ? pointsCost : stampsCost,
          business.name,
          businessCampaign.name,
          redemptionMethod === "points"
            ? participantCampaignBalance.campaign_balance
            : participantCampaignBalance.stamp_balance,
          voucherCode,
        );
      } catch (error) {
        console.error(
          "Failed to send reward redeemed email to participant:",
          error,
        );
      }

      if (businessCampaign.business) {
        try {
          await this.mailService.sendBusinessActivityEmail(
            businessCampaign.business.email,
            "REDEEM",
            redemptionMethod === "points" ? pointsCost : stampsCost,
            participant.name,
            staff ? staff.name : business.name,
            businessCampaign.name,
            sourceDescription ||
            `Redeemed: ${businessReward?.title || reward?.title || "Reward"}`,
          );
        } catch (error) {
          console.error(
            "Failed to send activity email to business owner:",
            error,
          );
        }
      }

      return participantCampaignBalance;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return await this.dataSource.transaction(execute);
    }
  }

  // Method A: Staff/Business scans Participant to Redeem
  async redeemRewardByScan(
    performerId: string,
    performerType: "Staff" | "Business",
    participantCode: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null,
    redemptionMethod: "points" | "stamps" = "points",
  ) {
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    return this.redeemReward(
      performerId,
      performerType,
      participant.id,
      rewardId,
      campaignId,
      redemptionCode,
      "Redeemed by scan",
      redemptionMethod,
    );
  }

  // Method C: Dual Code Redemption
  async redeemRewardDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null,
    redemptionMethod: "points" | "stamps" = "points",
  ) {
    const { staff, business } =
      await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({
      where: { uniqueCode: participantCode },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? "Staff" : "Business";

    return this.redeemReward(
      performerId,
      performerType,
      participant.id,
      rewardId,
      campaignId,
      redemptionCode,
      "Redeemed by dual scan",
      redemptionMethod,
    );
  }
}
