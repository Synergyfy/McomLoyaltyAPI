import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  Like,
  In,
  SelectQueryBuilder,
  DataSource,
  EntityManager,
} from "typeorm";
import {
  MatchingPointConfig,
  MatchingPointActivityType,
} from "../entities/matching-point-config.entity";
import { MatchingPointHistory } from "../entities/matching-point-history.entity";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Admin } from "../../admin/entities/admin.entity";
import { MailService } from "../../../mail/mail.service";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { GetMatchingPointHistoryDto } from "../dto/get-history.dto";
import {
  MatchingPointReward,
  TargetAudience,
} from "../entities/matching-point-reward.entity";
import {
  MatchingPointRedemption,
  UserType,
} from "../entities/matching-point-redemption.entity";
import { CreateMatchingPointRewardDto } from "../dto/create-matching-point-reward.dto";
import { UpdateMatchingPointRewardDto } from "../dto/update-matching-point-reward.dto";
import { GetMatchingPointRewardsFilterDto } from "../dto/get-rewards-filter.dto";

@Injectable()
export class MatchingPointService {
  private readonly logger = new Logger(MatchingPointService.name);

  constructor(
    @InjectRepository(MatchingPointConfig)
    private readonly configRepository: Repository<MatchingPointConfig>,
    @InjectRepository(MatchingPointHistory)
    private readonly historyRepository: Repository<MatchingPointHistory>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(MatchingPointReward)
    private readonly rewardRepository: Repository<MatchingPointReward>,
    @InjectRepository(MatchingPointRedemption)
    private readonly redemptionRepository: Repository<MatchingPointRedemption>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Seed configs
    const types = Object.values(MatchingPointActivityType).filter(
      (t) => t !== MatchingPointActivityType.MANUAL_ADJUSTMENT,
    );
    for (const type of types) {
      const exists = await this.configRepository.findOne({
        where: { activity_type: type },
      });
      if (!exists) {
        await this.configRepository.save(
          this.configRepository.create({
            activity_type: type,
            points: 0,
            is_active: true,
          }),
        );
      }
    }
  }

  async setConfig(
    type: MatchingPointActivityType,
    points: number,
    isActive: boolean = true,
  ) {
    let config = await this.configRepository.findOne({
      where: { activity_type: type },
    });
    if (!config) {
      config = this.configRepository.create({ activity_type: type });
    }
    config.points = points;
    config.is_active = isActive;
    return this.configRepository.save(config);
  }

  async getConfig(type?: MatchingPointActivityType) {
    if (type) {
      return this.configRepository.findOne({ where: { activity_type: type } });
    }
    return this.configRepository.find();
  }

  // --- Points Management ---

  async addPoints(
    userId: string,
    userType: UserType,
    type: MatchingPointActivityType,
    description?: string,
  ): Promise<number> {
    const config = await this.configRepository.findOne({
      where: { activity_type: type },
    });

    if (!config || !config.is_active || config.points <= 0) {
      return 0; // Config disabled or zero points
    }

    await this._processPointTransaction(
      userId,
      userType,
      config.points,
      type,
      description || `Points for ${type}`,
    );
    return config.points;
  }

  async manualAdjustment(
    userId: string,
    userType: UserType,
    points: number,
    description: string,
  ) {
    await this._processPointTransaction(
      userId,
      userType,
      points,
      MatchingPointActivityType.MANUAL_ADJUSTMENT,
      description,
    );
  }

  private async _processPointTransaction(
    userId: string,
    userType: UserType,
    points: number,
    type: MatchingPointActivityType,
    description: string,
    transactionalManager?: EntityManager,
  ) {
    const manager = transactionalManager || this.dataSource.manager;

    return await manager.transaction(async (manager) => {
      let balanceAfter = 0;
      let email = "";
      let business: Business | null = null;
      let participant: Participant | null = null;

      if (userType === UserType.BUSINESS) {
        business = await manager.findOne(Business, {
          where: { id: userId },
          lock: { mode: "pessimistic_write" },
        });
        if (!business) {
          throw new NotFoundException(`Business with ID ${userId} not found`);
        }
        business.matching_points = (business.matching_points || 0) + points;
        if (business.matching_points < 0) business.matching_points = 0;
        await manager.save(business);
        balanceAfter = business.matching_points;
        email = business.email;
      } else {
        participant = await manager.findOne(Participant, {
          where: { id: userId },
          lock: { mode: "pessimistic_write" },
        });
        if (!participant) {
          throw new NotFoundException(
            `Participant with ID ${userId} not found`,
          );
        }
        participant.matching_points =
          (participant.matching_points || 0) + points;
        if (participant.matching_points < 0) participant.matching_points = 0;
        await manager.save(participant);
        balanceAfter = participant.matching_points;
        email = participant.email;
      }

      const history = manager.create(MatchingPointHistory, {
        business: business || undefined,
        participant: participant || undefined,
        points,
        activity_type: type,
        description,
        balance_after: balanceAfter,
      });
      await manager.save(history);

      // Async side effect
      if (points > 0) {
        this.mailService
          .sendMatchingPointsReceivedEmail(
            email,
            points,
            description,
            balanceAfter,
          )
          .catch((e) =>
            this.logger.error(
              `Failed to send matching points email to ${email}`,
              e.stack,
            ),
          );
      }

      return balanceAfter;
    });
  }

  async getHistory(
    userId: string,
    userType: UserType,
    paginationDto: GetMatchingPointHistoryDto,
  ) {
    const { page = 1, limit = 10, activity_type, search } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userType === UserType.BUSINESS) {
      where.business = { id: userId };
    } else {
      where.participant = { id: userId };
    }

    if (activity_type) {
      where.activity_type = activity_type;
    }

    if (search) {
      where.description = Like(`%${search}%`);
    }

    const [data, total] = await this.historyRepository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async getMatchingPointsBalance(userId: string, userType: UserType) {
    if (userType === UserType.BUSINESS) {
      const business = await this.businessRepository.findOne({
        where: { id: userId },
      });
      if (!business) {
        throw new NotFoundException(`Business with ID ${userId} not found`);
      }
      return { matching_points: business.matching_points || 0 };
    } else {
      const participant = await this.participantRepository.findOne({
        where: { id: userId },
      });
      if (!participant) {
        throw new NotFoundException(`Participant with ID ${userId} not found`);
      }
      return { matching_points: participant.matching_points || 0 };
    }
  }

  // --- Rewards Management ---

  async createReward(
    createDto: CreateMatchingPointRewardDto,
    creatorId: string,
    creatorType: "ADMIN" | "SUPER_BUSINESS",
  ) {
    const reward = this.rewardRepository.create(createDto);

    if (creatorType === "ADMIN") {
      const admin = await this.adminRepository.findOne({
        where: { id: creatorId },
      });
      if (!admin) throw new NotFoundException("Admin not found");
      reward.creatorAdmin = admin;
    } else {
      const business = await this.businessRepository.findOne({
        where: { id: creatorId },
      });
      if (!business || !business.isSuperBusiness) {
        throw new ForbiddenException(
          "Only Super Businesses can create rewards.",
        );
      }
      reward.creatorBusiness = business;
    }

    return this.rewardRepository.save(reward);
  }

  async updateReward(
    rewardId: string,
    updateDto: UpdateMatchingPointRewardDto,
    userId: string,
    userRole: "ADMIN" | "BUSINESS",
  ) {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ["creatorBusiness", "creatorAdmin"],
    });

    if (!reward) throw new NotFoundException("Reward not found");

    // Check ownership
    if (userRole === "BUSINESS") {
      if (!reward.creatorBusiness || reward.creatorBusiness.id !== userId) {
        throw new ForbiddenException("You can only edit rewards you created.");
      }
    }

    Object.assign(reward, updateDto);
    return this.rewardRepository.save(reward);
  }

  async deleteReward(
    rewardId: string,
    userId: string,
    userRole: "ADMIN" | "BUSINESS",
  ) {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ["creatorBusiness", "creatorAdmin"],
    });

    if (!reward) throw new NotFoundException("Reward not found");

    if (userRole === "BUSINESS") {
      if (!reward.creatorBusiness || reward.creatorBusiness.id !== userId) {
        throw new ForbiddenException(
          "You can only delete rewards you created.",
        );
      }
    }

    await this.rewardRepository.remove(reward);
  }

  async toggleSuspendReward(
    rewardId: string,
    userId: string,
    userRole: "ADMIN" | "BUSINESS",
  ) {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ["creatorBusiness", "creatorAdmin"],
    });

    if (!reward) throw new NotFoundException("Reward not found");

    if (userRole === "BUSINESS") {
      if (!reward.creatorBusiness || reward.creatorBusiness.id !== userId) {
        throw new ForbiddenException(
          "You can only suspend rewards you created.",
        );
      }
    }

    reward.is_suspended = !reward.is_suspended;
    return this.rewardRepository.save(reward);
  }

  private applyRewardFilters(
    qb: SelectQueryBuilder<MatchingPointReward>,
    filterDto: GetMatchingPointRewardsFilterDto,
  ) {
    const {
      search,
      min_points,
      max_points,
      target_audience,
      start_date,
      end_date,
    } = filterDto;

    if (search) {
      qb.andWhere(
        "(reward.title ILIKE :search OR reward.short_description ILIKE :search OR reward.long_description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (min_points !== undefined) {
      qb.andWhere("reward.required_points >= :min_points", { min_points });
    }

    if (max_points !== undefined) {
      qb.andWhere("reward.required_points <= :max_points", { max_points });
    }

    if (target_audience) {
      qb.andWhere("reward.target_audience = :target_audience", {
        target_audience,
      });
    }

    if (start_date) {
      qb.andWhere("reward.start_datetime >= :start_date", { start_date });
    }

    if (end_date) {
      qb.andWhere("reward.end_datetime <= :end_date", { end_date });
    }

    return qb;
  }

  async getPublicRewards(filterDto: GetMatchingPointRewardsFilterDto) {
    const { page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const qb = this.rewardRepository.createQueryBuilder("reward");
    qb.where("reward.is_suspended = :suspended", { suspended: false });
    qb.andWhere("reward.quantity > 0");

    const now = new Date();
    qb.andWhere(
      "(reward.start_datetime IS NULL OR reward.start_datetime <= :now)",
      { now },
    );
    qb.andWhere(
      "(reward.end_datetime IS NULL OR reward.end_datetime >= :now)",
      {
        now,
      },
    );

    this.applyRewardFilters(qb, filterDto);

    qb.orderBy("reward.created_at", "DESC");
    qb.skip(skip).take(limit);

    const [result, count] = await qb.getManyAndCount();

    const totalPages = Math.ceil(count / limit);
    return {
      data: result,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async getCreatorRewards(
    creatorId: string,
    creatorType: "ADMIN" | "BUSINESS",
    filterDto: GetMatchingPointRewardsFilterDto,
  ) {
    const { page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const qb = this.rewardRepository.createQueryBuilder("reward");

    if (creatorType === "ADMIN") {
      qb.where("reward.creatorAdminId = :creatorId", { creatorId });
    } else {
      qb.where("reward.creatorBusinessId = :creatorId", { creatorId });
    }

    this.applyRewardFilters(qb, filterDto);

    qb.orderBy("reward.created_at", "DESC");
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async getReward(rewardId: string) {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ["creatorBusiness", "creatorAdmin"],
    });
    if (!reward) throw new NotFoundException("Reward not found");
    return reward;
  }

  // --- Redemption ---

  async redeemReward(rewardId: string, userId: string, userType: UserType) {
    return await this.dataSource.transaction(async (manager) => {
      const reward = await manager.findOne(MatchingPointReward, {
        where: { id: rewardId },
        lock: { mode: "pessimistic_write" },
      });

      if (!reward) throw new NotFoundException("Reward not found");
      if (reward.is_suspended)
        throw new BadRequestException("Reward is suspended");
      if (reward.quantity <= 0)
        throw new BadRequestException("Reward is out of stock");

      const now = new Date();
      if (reward.start_datetime && reward.start_datetime > now) {
        throw new BadRequestException(
          "Reward is not yet available for redemption",
        );
      }
      if (reward.end_datetime && reward.end_datetime < now) {
        throw new BadRequestException("Reward has expired");
      }

      // Check Audience
      if (userType === UserType.BUSINESS) {
        if (reward.target_audience === TargetAudience.PARTICIPANT_ONLY) {
          throw new ForbiddenException("This reward is for participants only");
        }
      } else {
        if (reward.target_audience === TargetAudience.BUSINESS_ONLY) {
          throw new ForbiddenException("This reward is for businesses only");
        }
      }

      // 1. Process Transaction (Deduct points) - Inside same manager
      await this._processPointTransaction(
        userId,
        userType,
        -reward.required_points,
        MatchingPointActivityType.REWARD_REDEMPTION,
        `Redeemed reward: ${reward.title}`,
        manager,
      );

      // 2. Update Reward Quantity
      reward.quantity -= 1;
      await manager.save(reward);

      // 3. Record Redemption
      const redemption = manager.create(MatchingPointRedemption, {
        reward,
        points_spent: reward.required_points,
        redeemer_type: userType,
      });

      if (userType === UserType.BUSINESS) {
        redemption.business = await manager.findOneBy(Business, { id: userId });
      } else {
        redemption.participant = await manager.findOneBy(Participant, {
          id: userId,
        });
      }

      await manager.save(redemption);

      return { message: "Reward redeemed successfully", redemption };
    });
  }

  async getRedeemedRewards(
    userId: string,
    userType: UserType,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userType === UserType.BUSINESS) {
      where.business = { id: userId };
    } else {
      where.participant = { id: userId };
    }

    const [data, total] = await this.redemptionRepository.findAndCount({
      where,
      relations: ["reward"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }
}
