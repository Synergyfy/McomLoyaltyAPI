import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Reward } from "../entities/reward.entity";
import { CreateRewardDto } from "../dto/create-reward.dto";
import { BusinessReward } from "../entities/business-reward.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";
import { CreateBusinessRewardDto } from "../dto/create-business-reward.dto";
import { UpdateBusinessRewardDto } from "../dto/update-business-reward.dto";
import { UpdateRewardDto } from "../dto/update-reward.dto";
import { Business } from "../../business/entities/business.entity";
import { RewardStatus } from "../enums/reward-status.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardType } from "../enums/reward-type.enum";
import { Membership } from "../../membership/entities/membership.entity";
import { Sector } from "../../sector/entities/sector.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { In, Brackets } from "typeorm";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { TierProgressionService } from "../../tier-progression/tier-progression.service";
import { RewardSource } from "../enums/reward-source.enum";
import { MembershipStatus } from "../../membership/entities/membership.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";

import { AddRewardToBusinessDto } from "../dto/add-reward-to-business.dto";

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @Inject(forwardRef(() => TierProgressionService))
    private readonly tierProgressionService: TierProgressionService,
  ) { }

  // Admin methods
  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    const {
      sector_ids,
      tier_ids,
      max_points,
      max_stamps_required,
      is_points_enabled = true,
      is_stamps_enabled = false,
      ...rewardData
    } = createRewardDto;

    if (!is_points_enabled && !is_stamps_enabled) {
      throw new ForbiddenException(
        "At least one of points or stamps must be enabled",
      );
    }

    if (is_points_enabled && !max_points) {
      throw new ForbiddenException(
        "Max points must be provided when points are enabled",
      );
    }

    if (is_stamps_enabled && !max_stamps_required) {
      throw new ForbiddenException(
        "Max stamps required must be provided when stamps are enabled",
      );
    }

    let sectors: Sector[] = [];
    if (sector_ids && sector_ids.length > 0) {
      sectors = await this.sectorRepository.findBy({ id: In(sector_ids) });
      if (sectors.length !== sector_ids.length) {
        throw new NotFoundException("One or more sectors not found");
      }
    }

    let tiers: Tier[] = [];
    if (tier_ids && tier_ids.length > 0) {
      tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
      if (tiers.length !== tier_ids.length) {
        throw new NotFoundException("One or more tiers not found");
      }
    }

    const reward = this.rewardRepository.create({
      ...rewardData,
      max_points,
      max_stamps_required,
      is_points_enabled,
      is_stamps_enabled,
      sectors: sectors,
      tiers: tiers,
    });
    return this.rewardRepository.save(reward);
  }

  async getRewards(
    page: number,
    limit: number,
  ): Promise<PaginationResult<Reward>> {
    const [data, total] = await this.rewardRepository.findAndCount({
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async updateReward(
    id: string,
    updateRewardDto: UpdateRewardDto,
  ): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException("Reward not found");
    }
    Object.assign(reward, updateRewardDto);
    return this.rewardRepository.save(reward);
  }

  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException("Reward not found");
    }
    const businessReward = await this.businessRewardRepository.findOne({
      where: { reward: { id } },
    });
    if (businessReward) {
      throw new ConflictException("Reward is in use by a business");
    }
    await this.rewardRepository.delete(id);
  }

  async disableReward(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException("Reward not found");
    }
    reward.disabled = true;
    return this.rewardRepository.save(reward);
  }

  async enableReward(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException("Reward not found");
    }
    reward.disabled = false;
    return this.rewardRepository.save(reward);
  }

  // Business methods
  async addRewardToBusiness(
    rewardId: string,
    businessId: string,
    addRewardToBusinessDto: AddRewardToBusinessDto,
  ): Promise<BusinessReward> {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ["sectors", "tiers"],
    });

    if (!reward) {
      throw new NotFoundException("Reward not found");
    }

    if (reward.status !== RewardStatus.ACTIVE) {
      throw new ForbiddenException("Reward is not active");
    }

    if (
      reward.expiry_datetime &&
      new Date(reward.expiry_datetime) < new Date()
    ) {
      throw new ForbiddenException("Reward has expired");
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ["sector"],
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (reward.audience === RewardAudience.SPECIFIC_SECTORS) {
      if (!reward.sectors.some((sector) => sector.id === business.sector.id)) {
        throw new ForbiddenException(
          "Business does not belong to the required sector for this reward",
        );
      }
    }

    if (reward.audience === RewardAudience.SPECIFIC_TIERS) {
      const membership = await this.membershipRepository.findOne({
        where: { business: { id: businessId } },
      });
      if (!membership || !membership.tier) {
        throw new ForbiddenException("Business does not have a tier");
      }
      if (!reward.tiers.some((tier) => tier.id === membership.tier.id)) {
        throw new ForbiddenException(
          "Business does not belong to the required tier for this reward",
        );
      }
    }

    const existingBusinessReward = await this.businessRewardRepository.findOne({
      where: {
        reward: { id: rewardId },
        business: { id: businessId },
      },
    });

    if (existingBusinessReward) {
      throw new ConflictException("Business already has this reward");
    }

    const isPointsEnabled =
      addRewardToBusinessDto.is_points_enabled ?? reward.is_points_enabled;
    const isStampsEnabled =
      addRewardToBusinessDto.is_stamps_enabled ?? reward.is_stamps_enabled;
    const stampEmoji =
      addRewardToBusinessDto.stamp_emoji ?? reward.stamp_emoji;

    if (!isPointsEnabled && !isStampsEnabled) {
      throw new ForbiddenException(
        "At least one of points or stamps must be enabled",
      );
    }

    if (isPointsEnabled && !reward.is_points_enabled) {
      throw new ForbiddenException(
        "Cannot enable points because it is disabled by the admin for this reward",
      );
    }

    if (isStampsEnabled && !reward.is_stamps_enabled) {
      throw new ForbiddenException(
        "Cannot enable stamps because it is disabled by the admin for this reward",
      );
    }

    const pointRequired = isPointsEnabled
      ? (addRewardToBusinessDto.points_required ?? reward.max_points)
      : null;
    const stampsRequired = isStampsEnabled
      ? (addRewardToBusinessDto.stamps_required ?? reward.max_stamps_required)
      : null;
    const quantity = addRewardToBusinessDto.quantity ?? reward.quantity;

    if (isPointsEnabled && !pointRequired) {
      throw new ForbiddenException(
        "Points required must be set when points are enabled",
      );
    }

    if (isStampsEnabled && !stampsRequired) {
      throw new ForbiddenException(
        "Stamps required must be set when stamps are enabled",
      );
    }

    if (
      pointRequired &&
      reward.max_points &&
      pointRequired > reward.max_points
    ) {
      throw new ForbiddenException(
        `Points required cannot exceed the maximum points set by admin (${reward.max_points})`,
      );
    }

    if (
      stampsRequired &&
      reward.max_stamps_required &&
      stampsRequired > reward.max_stamps_required
    ) {
      throw new ForbiddenException(
        `Stamps required cannot exceed the maximum stamps set by admin (${reward.max_stamps_required})`,
      );
    }

    const isMallReward = [
      RewardType.VOUCHER,
      RewardType.GIFT_CARD,
      RewardType.COUPON,
    ].includes(reward.reward_type);

    let mallRewardValue = 0;
    let isMallIntegrated = false;
    let mallRewardType = null;

    if (isMallReward) {
      if (
        !addRewardToBusinessDto.mall_reward_value ||
        addRewardToBusinessDto.mall_reward_value <= 0
      ) {
        throw new BadRequestException(
          "Value is required for Gift Cards, Vouchers, and Coupons when adding to business.",
        );
      }
      mallRewardValue = addRewardToBusinessDto.mall_reward_value;
      isMallIntegrated = true;

      if (reward.reward_type === RewardType.VOUCHER) {
        mallRewardType = "VOUCHER";
      } else if (reward.reward_type === RewardType.GIFT_CARD) {
        mallRewardType = "GIFT_CARD";
      } else if (reward.reward_type === RewardType.COUPON) {
        mallRewardType = "COUPON";
      }
    } else {
      if (addRewardToBusinessDto.mall_reward_value) {
        throw new BadRequestException(
          "Value cannot be set for this reward type.",
        );
      }
    }

    const businessReward = this.businessRewardRepository.create({
      reward,
      business: { id: businessId },
      title: reward.title,
      reward_type: reward.reward_type,
      reward_source: RewardSource.MCOM_VAULT,
      audience: reward.audience,
      expiry_datetime: reward.expiry_datetime,
      status: reward.status,
      description: reward.description,
      image: reward.image,
      disabled: reward.disabled,
      is_points_enabled: isPointsEnabled,
      is_stamps_enabled: isStampsEnabled,
      stamp_emoji: stampEmoji,
      points_required: pointRequired,
      stamps_required: stampsRequired,
      quantity: quantity,
      remaining_quantity: quantity,
      mall_reward_value: mallRewardValue,
      is_mall_integrated: isMallIntegrated,
      mall_reward_type: mallRewardType,
    });

    return this.businessRewardRepository.save(businessReward);
  }

  async createBusinessReward(
    businessId: string,
    createBusinessRewardDto: CreateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ["tier"],
    });

    if (!membership || !membership.tier) {
      throw new ForbiddenException(
        "Business does not have a valid membership or tier",
      );
    }

    // Check if the tier allows creating rewards from scratch
    if (
      !membership.tier.configuration?.featureFlags?.canCreateRewardFromScratch
    ) {
      throw new ForbiddenException(
        "Your current tier does not allow creating rewards from scratch",
      );
    }

    const {
      is_points_enabled = true,
      is_stamps_enabled = false,
      points_required,
      stamps_required,
    } = createBusinessRewardDto;

    if (!is_points_enabled && !is_stamps_enabled) {
      throw new ForbiddenException(
        "At least one of points or stamps must be enabled",
      );
    }

    if (is_points_enabled && !points_required) {
      throw new ForbiddenException(
        "Points required must be set when points are enabled",
      );
    }

    if (is_stamps_enabled && !stamps_required) {
      throw new ForbiddenException(
        "Stamps required must be set when stamps are enabled",
      );
    }

    const isMallReward = [
      RewardType.VOUCHER,
      RewardType.GIFT_CARD,
      RewardType.COUPON,
    ].includes(createBusinessRewardDto.reward_type);

    if (isMallReward) {
      if (
        !createBusinessRewardDto.mall_reward_value ||
        createBusinessRewardDto.mall_reward_value <= 0
      ) {
        throw new BadRequestException(
          "Value is required for Gift Cards, Vouchers, and Coupons.",
        );
      }
      createBusinessRewardDto.is_mall_integrated = true;
      // Map reward type to mall reward type
      if (createBusinessRewardDto.reward_type === RewardType.VOUCHER) {
        createBusinessRewardDto.mall_reward_type = "VOUCHER";
      } else if (createBusinessRewardDto.reward_type === RewardType.GIFT_CARD) {
        createBusinessRewardDto.mall_reward_type = "GIFT_CARD";
      } else if (createBusinessRewardDto.reward_type === RewardType.COUPON) {
        createBusinessRewardDto.mall_reward_type = "COUPON";
      }
    } else {
      if (createBusinessRewardDto.mall_reward_value) {
        throw new BadRequestException(
          "Value cannot be set for this reward type.",
        );
      }
      createBusinessRewardDto.is_mall_integrated = false;
      createBusinessRewardDto.mall_reward_value = 0;
      createBusinessRewardDto.mall_reward_type = null;
    }

    const businessReward = this.businessRewardRepository.create({
      ...createBusinessRewardDto,
      business: { id: businessId },
      reward_source: RewardSource.BUSINESS,
      audience: RewardAudience.ALL_BUSINESS,
      remaining_quantity: createBusinessRewardDto.quantity,
    });

    const savedReward =
      await this.businessRewardRepository.save(businessReward);

    // Check for promotion
    await this.tierProgressionService.checkAndPromote(businessId);

    return savedReward;
  }

  async getBusinessRewards(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<BusinessReward>> {
    const [data, total] = await this.businessRewardRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ["reward"],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async removeRewardFromBusiness(
    rewardId: string,
    businessId: string,
  ): Promise<void> {
    const activeCampaignsCount = await this.businessCampaignRepository
      .createQueryBuilder("businessCampaign")
      .innerJoin("businessCampaign.rewards", "reward")
      .innerJoin("businessCampaign.participants", "participant")
      .where("reward.id = :rewardId", { rewardId })
      .andWhere("businessCampaign.business.id = :businessId", { businessId })
      .andWhere("businessCampaign.end_date > :now", { now: new Date() })
      .andWhere("businessCampaign.disabled = :disabled", { disabled: false })
      .getCount();

    if (activeCampaignsCount > 0) {
      throw new ConflictException(
        "Cannot remove reward because it is being used in an active campaign with participants.",
      );
    }

    await this.businessRewardRepository.delete({
      id: rewardId,
      business: { id: businessId },
    });
  }

  async getUnaddedRewards(
    businessId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginationResult<Reward>> {
    // Get IDs of rewards already added by the business
    const addedRewards = await this.businessRewardRepository.find({
      where: { business: { id: businessId } },
      relations: ["reward"],
      select: ["reward"],
    });
    const addedRewardIds = addedRewards
      .map((br) => br.reward?.id)
      .filter((id) => id !== undefined);

    const queryBuilder = this.rewardRepository.createQueryBuilder("reward");

    queryBuilder
      .where("reward.status = :status", { status: RewardStatus.ACTIVE })
      .andWhere("reward.disabled = :disabled", { disabled: false });

    if (addedRewardIds.length > 0) {
      queryBuilder.andWhere("reward.id NOT IN (:...addedRewardIds)", {
        addedRewardIds,
      });
    }

    // Also check expiry
    queryBuilder.andWhere(
      "(reward.expiry_datetime IS NULL OR reward.expiry_datetime > :now)",
      { now: new Date() },
    );

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("reward.title ILIKE :search", {
            search: `%${search}%`,
          }).orWhere("reward.description ILIKE :search", {
            search: `%${search}%`,
          });
        }),
      );
    }

    queryBuilder
      .orderBy("reward.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    // Filter by audience
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ["sector"],
    });

    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ["tier"],
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    const tierId = membership.tier?.id;

    queryBuilder.andWhere(
      new Brackets((qb) => {
        // 1. Check Tier (Priority check)
        if (tierId) {
          qb.where(
            '(reward.audience = :tierAudience AND :tierId = ANY(SELECT "tierId" FROM "reward_tiers_tier" WHERE "rewardId" = reward.id))',
            {
              tierAudience: RewardAudience.SPECIFIC_TIERS,
              tierId: tierId,
            },
          );
        } else {
          qb.where("1=0");
        }

        // 2. Check All Business
        qb.orWhere("reward.audience = :allAudience", {
          allAudience: RewardAudience.ALL_BUSINESS,
        });

        // 3. Check Sector
        if (business.sector) {
          qb.orWhere(
            '(reward.audience = :sectorAudience AND :sectorId = ANY(SELECT "sectorId" FROM "reward_sectors_sector" WHERE "rewardId" = reward.id))',
            {
              sectorAudience: RewardAudience.SPECIFIC_SECTORS,
              sectorId: business.sector.id,
            },
          );
        }
      }),
    );

    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async countActiveBusinessRewards(businessId: string): Promise<number> {
    return this.businessRewardRepository.count({
      where: {
        business: { id: businessId },
        status: RewardStatus.ACTIVE,
        disabled: false,
      },
    });
  }

  async countTotalRewards(businessId: string): Promise<number> {
    return this.businessRewardRepository.count({
      where: { business: { id: businessId } },
    });
  }

  async updateBusinessReward(
    userId: string,
    id: string,
    updateBusinessRewardDto: UpdateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const businessReward = await this.businessRewardRepository.findOne({
      where: { id, business: { id: userId } },
      relations: ["reward"],
    });

    if (!businessReward) {
      throw new NotFoundException("Business reward not found.");
    }

    const isPointsEnabled =
      updateBusinessRewardDto.is_points_enabled ??
      businessReward.is_points_enabled;
    const isStampsEnabled =
      updateBusinessRewardDto.is_stamps_enabled ??
      businessReward.is_stamps_enabled;

    if (!isPointsEnabled && !isStampsEnabled) {
      throw new ForbiddenException(
        "At least one of points or stamps must be enabled",
      );
    }

    if (businessReward.reward) {
      if (
        updateBusinessRewardDto.is_points_enabled === true &&
        !businessReward.reward.is_points_enabled
      ) {
        throw new ForbiddenException(
          "Cannot enable points because it is disabled by the admin for this reward",
        );
      }
      if (
        updateBusinessRewardDto.is_stamps_enabled === true &&
        !businessReward.reward.is_stamps_enabled
      ) {
        throw new ForbiddenException(
          "Cannot enable stamps because it is disabled by the admin for this reward",
        );
      }

      if (
        updateBusinessRewardDto.points_required &&
        businessReward.reward.max_points &&
        updateBusinessRewardDto.points_required >
        businessReward.reward.max_points
      ) {
        throw new ForbiddenException(
          `Points required cannot exceed the maximum points set by admin (${businessReward.reward.max_points})`,
        );
      }

      if (
        updateBusinessRewardDto.stamps_required &&
        businessReward.reward.max_stamps_required &&
        updateBusinessRewardDto.stamps_required >
        businessReward.reward.max_stamps_required
      ) {
        throw new ForbiddenException(
          `Stamps required cannot exceed the maximum stamps set by admin (${businessReward.reward.max_stamps_required})`,
        );
      }
    }

    if (
      isPointsEnabled &&
      !updateBusinessRewardDto.points_required &&
      !businessReward.points_required
    ) {
      throw new ForbiddenException(
        "Points required must be set when points are enabled",
      );
    }

    if (
      isStampsEnabled &&
      !updateBusinessRewardDto.stamps_required &&
      !businessReward.stamps_required
    ) {
      throw new ForbiddenException(
        "Stamps required must be set when stamps are enabled",
      );
    }

    Object.assign(businessReward, updateBusinessRewardDto);

    if (!businessReward.is_points_enabled) {
      businessReward.points_required = null;
    }
    if (!businessReward.is_stamps_enabled) {
      businessReward.stamps_required = null;
    }

    return this.businessRewardRepository.save(businessReward);
  }

  async getMallRewardHistory(
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<PointHistory>> {
    const queryBuilder = this.pointHistoryRepository.createQueryBuilder("ph");

    queryBuilder
      .leftJoinAndSelect("ph.participant", "participant")
      .leftJoinAndSelect("ph.businessReward", "businessReward")
      .leftJoinAndSelect("businessReward.reward", "reward")
      .where("ph.business_id = :businessId", { businessId })
      .andWhere("ph.type = :type", { type: PointHistoryType.REDEEM })
      .andWhere("businessReward.is_mall_integrated = :isMallIntegrated", {
        isMallIntegrated: true,
      })
      .orderBy("ph.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async getMallRewardStats(businessId: string) {
    const queryBuilder = this.pointHistoryRepository.createQueryBuilder("ph");

    queryBuilder
      .leftJoinAndSelect("ph.businessReward", "businessReward")
      .where("ph.business_id = :businessId", { businessId })
      .andWhere("ph.type = :type", { type: PointHistoryType.REDEEM })
      .andWhere("businessReward.is_mall_integrated = :isMallIntegrated", {
        isMallIntegrated: true,
      });

    const history = await queryBuilder.getMany();

    const stats = history.reduce(
      (acc, item) => {
        const value = Number(item.businessReward.mall_reward_value || 0);
        acc.totalValue += value;
        acc.totalCount += 1;

        if (item.businessReward.mall_reward_type === "GIFT_CARD") {
          acc.giftCardsCount += 1;
          acc.giftCardsValue += value;
        } else if (item.businessReward.mall_reward_type === "VOUCHER") {
          acc.vouchersCount += 1;
          acc.vouchersValue += value;
        } else if (item.businessReward.mall_reward_type === "COUPON") {
          acc.couponsCount += 1;
          acc.couponsValue += value;
        }

        return acc;
      },
      {
        totalValue: 0,
        totalCount: 0,
        giftCardsCount: 0,
        giftCardsValue: 0,
        vouchersCount: 0,
        vouchersValue: 0,
        couponsCount: 0,
        couponsValue: 0,
      },
    );

    return stats;
  }

  async getParticipantMallRewardHistory(
    participantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<PointHistory>> {
    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where: {
        participant: { id: participantId },
        type: PointHistoryType.REDEEM,
        businessReward: { is_mall_integrated: true },
      },
      relations: ["business", "businessReward", "businessReward.reward"],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }
}
