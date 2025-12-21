import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { DealRedemption } from "./entities/deal-redemption.entity";
import { Deal } from "./entities/deal.entity";
import { User } from "../../common/interfaces/user.interface";
import { PurchaseDealDto } from "./dto/purchase-deal.dto";
import { RedemptionStatus } from "./enums/redemption-status.enum";
import { nanoid } from "nanoid";
import { DealStatus } from "./enums/deal-status.enum";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../participant-campaign-balance/entities/point-history.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { ParticipantProgressionService } from "../participant-progression/participant-progression.service";

@Injectable()
export class DealRedemptionService {
  constructor(
    @InjectRepository(DealRedemption)
    private readonly redemptionRepository: Repository<DealRedemption>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly dataSource: DataSource,
    private readonly progressionService: ParticipantProgressionService,
  ) {}

  async purchase(purchaseDealDto: PurchaseDealDto, user: User) {
    const { dealId, quantity } = purchaseDealDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const deal = await queryRunner.manager.findOne(Deal, {
        where: { id: dealId },
        lock: { mode: "pessimistic_write" }, // Lock the row to prevent race conditions on inventory
      });

      if (!deal) {
        throw new NotFoundException(`Deal with ID ${dealId} not found`);
      }

      if (!deal.isActive || deal.status !== DealStatus.APPROVED) {
        throw new BadRequestException("Deal is not active or approved");
      }

      if (
        deal.maxQuantity !== null &&
        deal.soldQuantity + quantity > deal.maxQuantity
      ) {
        throw new BadRequestException("Not enough inventory available");
      }

      if (deal.perCustomerLimit) {
        const userRedemptions = await this.redemptionRepository.count({
          where: { deal: { id: dealId }, user: { id: user.id } },
        });
        if (userRedemptions + quantity > deal.perCustomerLimit) {
          throw new BadRequestException(
            `You can only purchase ${deal.perCustomerLimit} of this deal`,
          );
        }
      }

      // Create redemptions
      const redemptions: DealRedemption[] = [];
      for (let i = 0; i < quantity; i++) {
        const redemption = this.redemptionRepository.create({
          deal,
          user: { id: user.id },
          status: RedemptionStatus.PENDING,
          redemptionCode: nanoid(10).toUpperCase(), // Generate unique code
        });
        redemptions.push(redemption);
      }

      await queryRunner.manager.save(DealRedemption, redemptions);

      // Update deal sold quantity
      deal.soldQuantity += quantity;
      await queryRunner.manager.save(Deal, deal);

      // Award points if applicable
      if (deal.pointsEarned > 0) {
        const participant = (await queryRunner.manager.findOne("Participant", {
          where: { id: user.id },
          relations: ["currentBadge"],
          lock: { mode: "pessimistic_write" },
        })) as any;

        if (participant) {
          let pointsToEarn = deal.pointsEarned * quantity;
          if (
            participant.currentBadge &&
            participant.currentBadge.multiplier > 1
          ) {
            pointsToEarn = Math.floor(
              pointsToEarn * participant.currentBadge.multiplier,
            );
          }

          participant.global_total_points += pointsToEarn;
          await queryRunner.manager.save(participant);
          // TODO: Insert PointHistory record for earning.
        }
      }

      await queryRunner.commitTransaction();

      // Trigger Purchase Reward
      // Use fire-and-forget to avoid blocking response or rolling back on reward failure (if preferred)
      // But usually we await it.
      this.progressionService
        .triggerAction(user.id, "PURCHASE")
        .catch((err) => {
          console.error("Failed to trigger purchase reward", err);
        });

      return redemptions;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async redeem(redemptionCode: string, user: User) {
    const redemption = await this.redemptionRepository.findOne({
      where: { redemptionCode },
      relations: ["deal", "deal.business"],
    });

    if (!redemption) {
      throw new NotFoundException("Invalid redemption code");
    }

    // Verify that the user (business) owns the deal
    if (redemption.deal.business.id !== user.id) {
      throw new BadRequestException(
        "You are not authorized to redeem this code",
      );
    }

    if (redemption.status === RedemptionStatus.REDEEMED) {
      throw new BadRequestException("Code already redeemed");
    }

    if (redemption.status !== RedemptionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot redeem code with status ${redemption.status}`,
      );
    }

    redemption.status = RedemptionStatus.REDEEMED;
    redemption.redeemedAt = new Date();

    return this.redemptionRepository.save(redemption);
  }

  async getMyRedemptions(user: User) {
    return this.redemptionRepository.find({
      where: { user: { id: user.id } },
      relations: ["deal"],
      order: { created_at: "DESC" } as any,
    });
  }

  async claimReward(dealId: string, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const deal = await queryRunner.manager.findOne(Deal, {
        where: { id: dealId },
        relations: ["business"], // Fetch business to check ownership
        lock: { mode: "pessimistic_write" },
      });

      if (!deal) {
        throw new NotFoundException(`Deal with ID ${dealId} not found`);
      }

      if (!deal.isActive || deal.status !== DealStatus.APPROVED) {
        throw new BadRequestException("Deal is not active or approved");
      }

      if (!deal.isReward) {
        throw new BadRequestException("This deal is not available as a reward");
      }

      if (deal.maxQuantity !== null && deal.soldQuantity >= deal.maxQuantity) {
        throw new BadRequestException("Not enough inventory available");
      }

      // Check user points from Business Campaigns
      const businessId = deal.business.id;

      const balances: ParticipantCampaignBalance[] =
        await queryRunner.manager.find(ParticipantCampaignBalance, {
          where: [
            {
              participant: { id: user.id },
              businessCampaign: { business: { id: businessId } },
            },
            {
              participant: { id: user.id },
              campaign: { business: { id: businessId } },
            },
          ],
          relations: ["businessCampaign", "campaign", "participant"],
          lock: { mode: "pessimistic_write" },
        });

      const totalPoints = balances.reduce(
        (sum, b) => sum + b.campaign_balance,
        0,
      );

      if (totalPoints < deal.pointsCost) {
        throw new BadRequestException(
          `Insufficient points from this business. You have ${totalPoints}, need ${deal.pointsCost}.`,
        );
      }

      // Deduct points
      let remainingCost = deal.pointsCost;
      for (const balance of balances) {
        if (remainingCost <= 0) break;
        if (balance.campaign_balance > 0) {
          const deduction = Math.min(balance.campaign_balance, remainingCost);
          balance.campaign_balance -= deduction;
          remainingCost -= deduction;
          await queryRunner.manager.save(balance);

          // Create PointHistory
          const history = queryRunner.manager.create(PointHistory, {
            participant: { id: user.id },
            points: deduction,
            type: PointHistoryType.REDEEM,
            campaign: balance.campaign,
            businessCampaign: balance.businessCampaign,
            deal: deal,
            business: { id: businessId },
            description: `Redeemed reward: ${deal.title}`,
          });
          await queryRunner.manager.save(history);
        }
      }

      // Update global points (Participant entity)
      const participant = (await queryRunner.manager.findOne("Participant", {
        where: { id: user.id },
        lock: { mode: "pessimistic_write" },
      })) as any;

      if (participant) {
        participant.global_total_points -= deal.pointsCost;
        await queryRunner.manager.save(participant);
      }

      // Create redemption
      const redemption = this.redemptionRepository.create({
        deal,
        user: { id: user.id },
        status: RedemptionStatus.PENDING,
        redemptionCode: nanoid(10).toUpperCase(),
      });

      await queryRunner.manager.save(DealRedemption, redemption);

      // Update deal sold quantity
      deal.soldQuantity += 1;
      await queryRunner.manager.save(Deal, deal);

      await queryRunner.commitTransaction();

      return redemption;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
