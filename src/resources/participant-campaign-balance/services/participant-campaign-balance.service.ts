import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager, In } from "typeorm";
import { Participant } from "../../participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../entities/participant-campaign-balance.entity";
import {
  TransactionCode,
  TransactionCodeStatus,
  TransactionType,
} from "../entities/transaction-code.entity";
import { FindOptionsWhere } from "typeorm";
import { PointEarningService } from "./point-earning.service";
import { RedemptionService } from "./redemption.service";
import { PointHistory } from "../entities/point-history.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { TierProgressionService } from "../../tier-progression/tier-progression.service";
import {
  GetHistoryQueryDto,
  HistoryDisplayType,
} from "../dto/get-history-query.dto";
import { PointHistoryType } from "../entities/point-history.entity";

@Injectable()
export class ParticipantCampaignBalanceService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(TransactionCode)
    private readonly transactionCodeRepository: Repository<TransactionCode>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    private readonly pointEarningService: PointEarningService,
    private readonly redemptionService: RedemptionService,
    private readonly dataSource: DataSource,
    private readonly tierProgressionService: TierProgressionService,
  ) {}

  async getParticipantBalance(participantId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    const campaignBalances =
      await this.participantCampaignBalanceRepository.find({
        where: { participant: { id: participantId } },
        relations: ["campaign", "businessCampaign"],
      });

    return {
      global_total_points: participant.global_total_points,
      campaign_balances: campaignBalances.map((balance) => ({
        campaign_id: balance.businessCampaign
          ? balance.businessCampaign.id
          : balance.campaign
            ? balance.campaign.id
            : null,
        campaign_name: balance.businessCampaign
          ? balance.businessCampaign.name
          : balance.campaign
            ? balance.campaign.name
            : "Unknown",
        balance: balance.campaign_balance,
        stamp_balance: balance.stamp_balance,
      })),
    };
  }

  async getParticipantBalanceForCampaign(
    participantId: string,
    campaignId: string,
  ) {
    // Check both Campaign and BusinessCampaign logic
    // Since we don't know if campaignId is BC or C, try to find PCB by one of them.
    // Note: Typically campaignId passed here corresponds to the one the user is viewing.

    const campaignBalance =
      await this.participantCampaignBalanceRepository.findOne({
        where: this.getCampaignCriteria(participantId, campaignId),
        relations: ["campaign", "businessCampaign"],
      });

    if (!campaignBalance) {
      throw new NotFoundException(
        "Participant is not enrolled in this campaign or campaign does not exist.",
      );
    }

    const cId = campaignBalance.businessCampaign
      ? campaignBalance.businessCampaign.id
      : campaignBalance.campaign.id;
    const cName = campaignBalance.businessCampaign
      ? campaignBalance.businessCampaign.name
      : campaignBalance.campaign.name;

    return {
      campaign_id: cId,
      campaign_name: cName,
      balance: campaignBalance.campaign_balance,
      stamp_balance: campaignBalance.stamp_balance,
    };
  }

  async isJoined(
    participantId: string,
    campaignId: string,
  ): Promise<{ isJoined: boolean }> {
    // 1. Check balance table first (fastest and handles most cases)
    const hasBalanceRecord =
      await this.participantCampaignBalanceRepository.exists({
        where: this.getCampaignCriteria(participantId, campaignId),
      });

    if (hasBalanceRecord) {
      return { isJoined: true };
    }

    // 2. Fallback: Check ManyToMany relationships on Participant
    // This handles cases where a user joined a 0-point campaign before the fix
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["campaigns", "businessCampaigns"],
    });

    if (!participant) return { isJoined: false };

    const isJoined =
      participant.campaigns.some((c) => c.id === campaignId) ||
      participant.businessCampaigns.some((bc) => bc.id === campaignId);

    return { isJoined };
  }

  private getCampaignCriteria(
    participantId: string,
    campaignId: string,
  ): FindOptionsWhere<ParticipantCampaignBalance>[] {
    return [
      { participant: { id: participantId }, campaign: { id: campaignId } },
      {
        participant: { id: participantId },
        businessCampaign: { id: campaignId },
      },
    ];
  }

  async getHistoryForCampaign(
    participantId: string,
    campaignId: string,
    query: GetHistoryQueryDto,
  ) {
    const {
      page = 1,
      limit = 10,
      historyType = HistoryDisplayType.BOTH,
    } = query;
    // Check if participant is joined
    const isJoined = await this.isJoined(participantId, campaignId);
    if (!isJoined.isJoined) {
      throw new BadRequestException(
        "You are not participating in this campaign",
      );
    }

    const where: any = this.getCampaignCriteria(participantId, campaignId);

    // Apply historyType filtering
    if (Array.isArray(where)) {
      where.forEach((w) => {
        if (historyType === HistoryDisplayType.POINTS) {
          w.type = In([
            PointHistoryType.EARN,
            PointHistoryType.REDEEM,
            PointHistoryType.PURCHASED_EXTRA,
          ]);
        } else if (historyType === HistoryDisplayType.STAMPS) {
          w.type = In([
            PointHistoryType.STAMP_EARN,
            PointHistoryType.STAMP_REDEEM,
          ]);
        }
      });
    }

    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["campaign", "businessCampaign", "reward", "business"],
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAllHistory(participantId: string, query: GetHistoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      historyType = HistoryDisplayType.BOTH,
    } = query;

    const where: any = {
      participant: { id: participantId },
    };

    if (historyType === HistoryDisplayType.POINTS) {
      where.type = In([
        PointHistoryType.EARN,
        PointHistoryType.REDEEM,
        PointHistoryType.PURCHASED_EXTRA,
      ]);
    } else if (historyType === HistoryDisplayType.STAMPS) {
      where.type = In([
        PointHistoryType.STAMP_EARN,
        PointHistoryType.STAMP_REDEEM,
      ]);
    }

    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: [
        "campaign",
        "businessCampaign",
        "reward",
        "business",
        "businessReward",
      ],
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async claimCode(participantId: string, code: string, campaignId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Lock and fetch the transaction code first
      const rawCode = await manager
        .createQueryBuilder(TransactionCode, "tc")
        .where("tc.code = :code", { code })
        .setLock("pessimistic_write")
        .getOne();

      if (!rawCode) {
        throw new NotFoundException("Transaction code not found");
      }

      // 2. Now, fetch the full data with relations
      const transactionCode = await manager.findOne(TransactionCode, {
        where: { id: rawCode.id },
        relations: [
          "campaign",
          "businessCampaign",
          "reward",
          "creator_business",
          "creator_staff",
        ],
      });

      // Check validation against businessCampaign or campaign
      if (transactionCode.businessCampaign) {
        if (transactionCode.businessCampaign.id !== campaignId) {
          throw new BadRequestException("Code is not valid for this campaign");
        }
      } else if (transactionCode.campaign) {
        if (transactionCode.campaign.id !== campaignId) {
          // Fallback: check if the campaignId matches a BusinessCampaign linked to the Campaign
          const bc = await manager.findOne(BusinessCampaign, {
            where: { id: campaignId },
            relations: ["campaign"],
          });
          if (
            !bc ||
            !bc.campaign ||
            bc.campaign.id !== transactionCode.campaign.id
          ) {
            throw new BadRequestException(
              "Code is not valid for this campaign",
            );
          }
        }
      } else {
        // Should not happen if data integrity is maintained, but handles case where neither is linked
        throw new BadRequestException(
          "Transaction code is not linked to any campaign",
        );
      }

      if (transactionCode.status !== TransactionCodeStatus.ACTIVE) {
        throw new BadRequestException(`Code is ${transactionCode.status}`);
      }

      if (transactionCode.expires_at < new Date()) {
        transactionCode.status = TransactionCodeStatus.EXPIRED;
        await manager.save(transactionCode);
        throw new BadRequestException("Code has expired");
      }

      // 2. Mark as Used
      transactionCode.status = TransactionCodeStatus.USED;
      transactionCode.used_by_participant = { id: participantId } as any;
      await manager.save(transactionCode);

      const performerId = transactionCode.creator_staff
        ? transactionCode.creator_staff.id
        : transactionCode.creator_business.id;
      const performerType = transactionCode.creator_staff
        ? "Staff"
        : "Business";

      if (transactionCode.type === TransactionType.EARN) {
        return this.pointEarningService.awardPoints(
          performerId,
          performerType,
          participantId,
          campaignId,
          transactionCode.points,
          "Awarded via claimed code",
          manager, // Pass manager
        );
      } else {
        if (!transactionCode.reward)
          throw new BadRequestException("This code is not linked to a reward");
        return this.redemptionService.redeemReward(
          performerId,
          performerType,
          participantId,
          transactionCode.reward.id,
          campaignId,
          code,
          "Redeemed via claimed code",
          (transactionCode.redemption_method as any) || "auto",
          manager, // Pass manager
        );
      }
    });

    // Check for promotion after transaction
    // We need businessId.
    // We can fetch the transaction code again or just use the one we had?
    // But we are outside transaction now.
    // We can fetch it or just use the logic:
    // We need to know who created the code.
    // Let's fetch the code briefly or use a variable from inside transaction?
    // We can't easily pass variables out of transaction callback unless we return them.
    // But 'claimCode' returns the result of awardPoints or redeemReward.

    // Let's just re-fetch the code to be safe and simple, or better:
    // We know the code string.
    const tc = await this.transactionCodeRepository.findOne({
      where: { code },
      relations: [
        "creator_business",
        "creator_staff",
        "creator_staff.business",
      ],
    });

    if (tc) {
      const businessId =
        tc.creator_business?.id || tc.creator_staff?.business?.id;
      if (businessId) {
        await this.tierProgressionService.checkAndPromote(businessId);
      }
    }

    return result;
  }
}
