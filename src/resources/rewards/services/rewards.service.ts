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
import { GetRewardsFilterDto, SortBy } from "../dto/get-rewards-filter.dto";
import { LibraryAsset } from "../../library-assets/entities/library-asset.entity";
import { ImageSourceType } from "../enums/image-source-type.enum";
import { Category } from "../../category/entities/category.entity";
import { SubCategory } from "../../subcategory/entities/subcategory.entity";

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
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @Inject(forwardRef(() => TierProgressionService))
    private readonly tierProgressionService: TierProgressionService,
    @InjectRepository(LibraryAsset)
    private readonly libraryAssetRepository: Repository<LibraryAsset>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    const {
      image_source_type,
      library_asset_id,
      sector_id,
      category_id,
      sub_category_id,
      emoji,
      ...rest
    } = createRewardDto;

    let imageToUse = createRewardDto.image;

    if (image_source_type === ImageSourceType.SECTOR_LOGO && sector_id) {
      const sector = await this.sectorRepository.findOne({
        where: { id: sector_id },
      });
      if (sector) imageToUse = sector.imageUrl;
    } else if (
      image_source_type === ImageSourceType.CATEGORY_LOGO &&
      category_id
    ) {
      const category = await this.categoryRepository.findOne({
        where: { id: category_id },
      });
      if (category) imageToUse = category.imageUrl;
    } else if (
      image_source_type === ImageSourceType.SUB_CATEGORY_LOGO &&
      sub_category_id
    ) {
      const subCategory = await this.subCategoryRepository.findOne({
        where: { id: sub_category_id },
      });
      if (subCategory) imageToUse = subCategory.imageUrl;
    } else if (image_source_type === ImageSourceType.LIBRARY_ASSET) {
      if (library_asset_id) {
        const asset = await this.libraryAssetRepository.findOne({
          where: { id: library_asset_id },
        });
        if (asset) imageToUse = asset.url;
      }
    } else if (image_source_type === ImageSourceType.EMOJI) {
      imageToUse = emoji || "🎁";
    }

    if (!rest.max_points && !rest.max_stamps_required) {
      throw new ForbiddenException(
        "At least one of max_points or max_stamps_required must be provided",
      );
    }

    const sectors = rest.sector_ids
      ? await this.sectorRepository.findBy({ id: In(rest.sector_ids) })
      : [];
    if (rest.sector_ids && sectors.length !== rest.sector_ids.length) {
      throw new NotFoundException("One or more sectors not found");
    }

    const tiers = rest.tier_ids
      ? await this.tierRepository.findBy({ id: In(rest.tier_ids) })
      : [];
    if (rest.tier_ids && tiers.length !== rest.tier_ids.length) {
      throw new NotFoundException("One or more tiers not found");
    }

    const reward = this.rewardRepository.create({
      ...rest,
      image: imageToUse,
      sectors,
      tiers,
    });
    return this.rewardRepository.save(reward);
  }

  async getRewards(
    filterDto: GetRewardsFilterDto,
  ): Promise<PaginationResult<Reward>> {
    return this.getGlobalRewards(filterDto);
  }

  async findOne(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }
    return reward;
  }

  async updateReward(
    id: string,
    updateRewardDto: UpdateRewardDto,
  ): Promise<Reward> {
    await this.findOne(id);
    await this.rewardRepository.update(id, updateRewardDto);
    return this.findOne(id);
  }

  async deleteReward(id: string): Promise<void> {
    await this.findOne(id);
    await this.rewardRepository.delete(id);
  }

  async disableReward(id: string): Promise<Reward> {
    const reward = await this.findOne(id);
    reward.disabled = true;
    return this.rewardRepository.save(reward);
  }

  async enableReward(id: string): Promise<Reward> {
    const reward = await this.findOne(id);
    reward.disabled = false;
    return this.rewardRepository.save(reward);
  }

  async addRewardToBusiness(
    rewardId: string,
    businessId: string,
    addRewardToBusinessDto: AddRewardToBusinessDto,
  ): Promise<BusinessReward> {
    const { ...rest } = addRewardToBusinessDto;
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
    });
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`);
    }

    const isPointsEnabled =
      rest.is_points_enabled !== undefined
        ? rest.is_points_enabled
        : reward.is_points_enabled;
    const isStampsEnabled =
      rest.is_stamps_enabled !== undefined
        ? rest.is_stamps_enabled
        : reward.is_stamps_enabled;

    if (!isPointsEnabled && !isStampsEnabled) {
      throw new BadRequestException(
        "At least one of points or stamps must be enabled",
      );
    }

    if (isPointsEnabled && !reward.is_points_enabled) {
      throw new BadRequestException(
        "Points are not enabled for this base reward",
      );
    }

    if (isStampsEnabled && !reward.is_stamps_enabled) {
      throw new BadRequestException(
        "Stamps are not enabled for this base reward",
      );
    }

    const pointRequired = isPointsEnabled
      ? rest.points_required || reward.max_points
      : null;

    const stampsRequired = isStampsEnabled
      ? rest.stamps_required || reward.max_stamps_required
      : null;

    if (isPointsEnabled && !pointRequired) {
      throw new BadRequestException(
        "Points required must be specified if points are enabled",
      );
    }

    if (isStampsEnabled && !stampsRequired) {
      throw new BadRequestException(
        "Stamps required must be specified if stamps are enabled",
      );
    }

    // Check points Required against Tier Max Points
    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ["tier"],
    });

    if (membership && membership.tier) {
      const maxPoints = membership.tier.configuration.quotas.maxRewardPoints;
      if (pointRequired && pointRequired > maxPoints) {
        throw new BadRequestException(
          `Points required cannot exceed the maximum points set by admin (${maxPoints} points).`,
        );
      }
    }

    const businessReward = this.businessRewardRepository.create({
      ...rest,
      business,
      reward,
      points_required: pointRequired,
      stamps_required: stampsRequired,
      is_points_enabled: isPointsEnabled,
      is_stamps_enabled: isStampsEnabled,
      status: (rest as any).status || RewardStatus.ACTIVE,
      reward_type: (rest as any).reward_type || reward.reward_type,
      reward_source: (rest as any).reward_source || reward.reward_source,
      audience: (rest as any).audience || reward.audience,
      description: (rest as any).description || reward.description,
      image: (rest as any).image || reward.image,
      gallery: (rest as any).gallery || reward.gallery,
    });

    return this.businessRewardRepository.save(businessReward);
  }

  async createBusinessReward(
    businessId: string,
    createBusinessRewardDto: CreateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // 1. Check points Required against Tier Max Points
    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ["tier"],
    });

    const isPointsEnabled = createBusinessRewardDto.is_points_enabled ?? true;
    const isStampsEnabled = createBusinessRewardDto.is_stamps_enabled ?? false;

    if (isPointsEnabled && membership && membership.tier) {
      const maxPoints = membership.tier.configuration.quotas.maxRewardPoints;
      const pointRequired = createBusinessRewardDto.points_required;
      if (pointRequired && pointRequired > maxPoints) {
        throw new BadRequestException(
          `Points required cannot exceed the maximum points set by admin (${maxPoints} points).`,
        );
      }
    }

    const {
      reward_type,
      reward_source = RewardSource.BUSINESS,
      audience = RewardAudience.ALL_BUSINESS,
      description,
      image,
      gallery,
      points_required,
      stamps_required,
    } = createBusinessRewardDto;

    // Determine Image
    let imageToUse = createBusinessRewardDto.image;
    const { image_source_type, library_asset_id, emoji, stamp_emoji } =
      createBusinessRewardDto;

    if (image_source_type === ImageSourceType.BUSINESS_LOGO) {
      imageToUse = business.profile_image;
    } else if (image_source_type === ImageSourceType.LIBRARY_ASSET) {
      if (library_asset_id) {
        const asset = await this.libraryAssetRepository.findOne({
          where: { id: library_asset_id },
        });
        if (asset) imageToUse = asset.url;
      }
    } else if (image_source_type === ImageSourceType.EMOJI) {
      // Emojis are strings, but we need a URL for 'image' field if UI expects it.
      // Or UI handles emoji separately. Usually we might store emoji in description or a new field.
      // If we must use 'image', we can store the emoji character directly or a transparent placeholder.
      imageToUse = emoji || "🎁";
    }

    createBusinessRewardDto.image = imageToUse;

    // Automatic Mall Integration if type is Voucher/Gift Card/Coupon
    if (
      [RewardType.VOUCHER, RewardType.GIFT_CARD, RewardType.COUPON].includes(
        createBusinessRewardDto.reward_type,
      )
    ) {
      if (
        !createBusinessRewardDto.mall_reward_value ||
        createBusinessRewardDto.mall_reward_value <= 0
      ) {
        // Option A: Throw Error
        // throw new BadRequestException("Monetary value required for this reward type");
        // Option B: Disable integration
        createBusinessRewardDto.is_mall_integrated = false;
      } else {
        createBusinessRewardDto.is_mall_integrated = true;
        // Map Mall Reward Type
        if (createBusinessRewardDto.reward_type === RewardType.VOUCHER) {
          createBusinessRewardDto.mall_reward_type = "VOUCHER";
        } else if (
          createBusinessRewardDto.reward_type === RewardType.GIFT_CARD
        ) {
          createBusinessRewardDto.mall_reward_type = "GIFT_CARD";
        } else if (createBusinessRewardDto.reward_type === RewardType.COUPON) {
          createBusinessRewardDto.mall_reward_type = "COUPON";
        }
      }
    } else {
      if (createBusinessRewardDto.mall_reward_value) {
        // User provided value for a physical product? Allow but disable automated distribution?
        // Usually, keep false.
      }
      createBusinessRewardDto.is_mall_integrated = false;
      createBusinessRewardDto.mall_reward_value = 0;
      createBusinessRewardDto.mall_reward_type = null;
    }

    const businessReward = this.businessRewardRepository.create({
      ...createBusinessRewardDto,
      business,
      reward_source,
      audience,
      points_required,
      stamps_required,
      is_points_enabled: isPointsEnabled,
      is_stamps_enabled: isStampsEnabled,
      remaining_quantity: createBusinessRewardDto.quantity,
    });

    const saved = await this.businessRewardRepository.save(businessReward);

    // Trigger promotion check after adding reward
    await this.tierProgressionService.checkAndPromote(businessId);

    return saved;
  }

  async updateBusinessReward(
    businessId: string,
    rewardId: string,
    updateBusinessRewardDto: UpdateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const businessReward = await this.businessRewardRepository.findOne({
      where: { id: rewardId, business: { id: businessId } },
      relations: ["reward", "business"],
    });
    if (!businessReward) {
      throw new NotFoundException(
        `BusinessReward with ID ${rewardId} not found`,
      );
    }

    if (
      updateBusinessRewardDto.stamps_required &&
      businessReward.reward &&
      updateBusinessRewardDto.stamps_required >
        businessReward.reward.max_stamps_required
    ) {
      throw new ForbiddenException(
        `Stamps required cannot exceed the maximum stamps set by admin (${businessReward.reward.max_stamps_required} stamps).`,
      );
    }

    // Check points Required against Tier Max Points
    if (updateBusinessRewardDto.points_required) {
      const membership = await this.membershipRepository.findOne({
        where: { business: { id: businessId } },
        relations: ["tier"],
      });

      if (membership && membership.tier) {
        const maxPoints = membership.tier.configuration.quotas.maxRewardPoints;
        if (updateBusinessRewardDto.points_required > maxPoints) {
          throw new BadRequestException(
            `Points required cannot exceed the maximum points set by admin (${maxPoints} points).`,
          );
        }
      }
    }

    Object.assign(businessReward, updateBusinessRewardDto);
    return this.businessRewardRepository.save(businessReward);
  }

  async getBusinessRewards(
    businessId: string,
    page: number = 1,
    limit: number = 10,
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

  async getMallRewardHistory(
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<PointHistory>> {
    const query = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoinAndSelect("ph.participant", "participant")
      .leftJoinAndSelect("ph.businessReward", "businessReward")
      .leftJoin("businessReward.reward", "reward")
      .addSelect([
        "reward.id",
        "reward.title",
        "reward.image",
        "reward.description",
        "reward.reward_type",
        "reward.value",
      ])
      .where("ph.business_id = :businessId", { businessId })
      .andWhere("(ph.type = :redeem OR ph.type = :stampRedeem)", {
        redeem: PointHistoryType.REDEEM,
        stampRedeem: PointHistoryType.STAMP_REDEEM,
      })
      .andWhere("businessReward.is_mall_integrated = :isIntegrated", {
        isIntegrated: true,
      })
      .orderBy("ph.created_at", "DESC");

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async getUnaddedRewards(
    businessId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginationResult<Reward>> {
    const businessRewards = await this.businessRewardRepository.find({
      where: { business: { id: businessId } },
      relations: ["reward"],
    });

    const addedRewardIds = businessRewards
      .map((br) => br.reward?.id)
      .filter((id) => !!id);

    const queryBuilder = this.rewardRepository.createQueryBuilder("reward");

    queryBuilder.where(
      new Brackets((qb) => {
        qb.where("reward.audience = :aud1", {
          aud1: RewardAudience.ALL_BUSINESS,
        });
      }),
    );

    if (addedRewardIds.length > 0) {
      queryBuilder.andWhere("reward.id NOT IN (:...addedRewardIds)", {
        addedRewardIds,
      });
    }

    if (search) {
      queryBuilder.andWhere("reward.title ILIKE :search", {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy("reward.created_at", "DESC");

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      next: page * limit < total ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async getGlobalRewards(
    filterDto: GetRewardsFilterDto,
  ): Promise<PaginationResult<Reward>> {
    const {
      page = 1,
      limit = 10,
      search,
      sectorId,
      rewardType,
      audience,
      sortBy = SortBy.NEWEST,
      includeStats,
    } = filterDto;

    const queryBuilder = this.rewardRepository.createQueryBuilder("reward");

    if (includeStats) {
      // 1. Business Claim Count
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(br.id)", "count")
          .from(BusinessReward, "br")
          .where("br.reward_id = reward.id");
      }, "business_claimed_count");

      // 2. Redemption Count
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(ph.id)", "count")
          .from(PointHistory, "ph")
          .innerJoin("ph.businessReward", "br")
          .where("br.reward_id = reward.id")
          .andWhere("ph.type IN (:...types)", {
            types: [PointHistoryType.REDEEM, PointHistoryType.STAMP_REDEEM],
          });
      }, "total_redemptions_count");

      // 3. Points Redeemed
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select("COALESCE(SUM(ph.points), 0)", "sum")
          .from(PointHistory, "ph")
          .innerJoin("ph.businessReward", "br")
          .where("br.reward_id = reward.id")
          .andWhere("ph.type IN (:...types)", {
            types: [PointHistoryType.REDEEM, PointHistoryType.STAMP_REDEEM],
          });
      }, "total_points_redeemed");

      // 4. Stamps Redeemed
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select("COALESCE(SUM(ph.stamps), 0)", "sum")
          .from(PointHistory, "ph")
          .innerJoin("ph.businessReward", "br")
          .where("br.reward_id = reward.id")
          .andWhere("ph.type IN (:...types)", {
            types: [PointHistoryType.REDEEM, PointHistoryType.STAMP_REDEEM],
          });
      }, "total_stamps_redeemed");
    }

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

    if (sectorId) {
      // Assuming rewards are linked to sectors directly or through campaigns
      // For this implementation, we check the campaign relation if it exists
      // If reward belongs to a campaign, and campaign belongs to sector.
    }

    if (rewardType) {
      queryBuilder.andWhere("reward.reward_type = :rewardType", { rewardType });
    }

    if (audience) {
      queryBuilder.andWhere("reward.audience = :audience", { audience });
    }

    // Sorting
    if (sortBy === SortBy.NEWEST) {
      queryBuilder.orderBy("reward.created_at", "DESC");
    } else if (sortBy === SortBy.POINTS_LOW) {
      queryBuilder.orderBy("reward.points_required", "ASC");
    } else if (sortBy === SortBy.POINTS_HIGH) {
      queryBuilder.orderBy("reward.points_required", "DESC");
    }

    let data: Reward[];
    let total: number;

    if (includeStats) {
      const { entities, raw } = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getRawAndEntities();

      total = await queryBuilder.getCount();

      data = entities.map((entity) => {
        const rawResult = raw.find((r) => r.reward_id === entity.id);
        if (rawResult) {
          entity.business_claimed_count = Number(
            rawResult.business_claimed_count || 0,
          );
          entity.total_redemptions_count = Number(
            rawResult.total_redemptions_count || 0,
          );
          entity.total_points_redeemed = Number(
            rawResult.total_points_redeemed || 0,
          );
          entity.total_stamps_redeemed = Number(
            rawResult.total_stamps_redeemed || 0,
          );
        }
        return entity;
      });
    } else {
      [data, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
    }

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      next: page * limit < total ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async removeRewardFromBusiness(
    rewardId: string,
    businessId: string,
  ): Promise<void> {
    const businessReward = await this.businessRewardRepository.findOne({
      where: { id: rewardId, business: { id: businessId } },
      relations: ["businessCampaigns"],
    });

    if (!businessReward) {
      throw new NotFoundException(`Business Reward not found`);
    }

    // Check if it's linked to any active campaigns
    if (
      businessReward.businessCampaigns &&
      businessReward.businessCampaigns.length > 0
    ) {
      const activeCampaigns = businessReward.businessCampaigns.filter(
        (bc) => !bc.disabled,
      );
      if (activeCampaigns.length > 0) {
        throw new BadRequestException(
          "Cannot remove reward that is currently linked to active campaigns. Disable the campaigns first.",
        );
      }
    }

    await this.businessRewardRepository.remove(businessReward);
  }

  async getMallRewardStats(businessId: string) {
    const history = await this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoinAndSelect("ph.businessReward", "businessReward")
      .where("ph.business_id = :businessId", { businessId })
      .andWhere("(ph.type = :redeem OR ph.type = :stampRedeem)", {
        redeem: PointHistoryType.REDEEM,
        stampRedeem: PointHistoryType.STAMP_REDEEM,
      })
      .andWhere("businessReward.is_mall_integrated = :isIntegrated", {
        isIntegrated: true,
      })
      .getMany();

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
    const query = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoinAndSelect("ph.business", "business")
      .leftJoinAndSelect("ph.businessReward", "businessReward")
      .leftJoin("businessReward.reward", "reward")
      .addSelect([
        "reward.id",
        "reward.title",
        "reward.image",
        "reward.description",
        "reward.reward_type",
        "reward.value",
      ])
      .where("ph.participant_id = :participantId", { participantId })
      .andWhere("(ph.type = :redeem OR ph.type = :stampRedeem)", {
        redeem: PointHistoryType.REDEEM,
        stampRedeem: PointHistoryType.STAMP_REDEEM,
      })
      .andWhere("businessReward.is_mall_integrated = :isIntegrated", {
        isIntegrated: true,
      })
      .orderBy("ph.created_at", "DESC");

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async countTotalRewards(businessId: string): Promise<number> {
    return this.businessRewardRepository.count({
      where: { business: { id: businessId } },
    });
  }

  async countActiveBusinessRewards(businessId: string): Promise<number> {
    return this.businessRewardRepository.count({
      where: { business: { id: businessId }, disabled: false },
    });
  }
}
