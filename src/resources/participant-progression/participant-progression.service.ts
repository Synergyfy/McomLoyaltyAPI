import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Participant } from "../participant/entities/participant.entity";
import { ParticipantBadge } from "./entities/participant-badge.entity";
import { EarningAction } from "./entities/earning-action.entity";
import { CreateParticipantBadgeDto } from "./dto/create-participant-badge.dto";
import { MailService } from "../../mail/mail.service";
import { CreateEarningActionDto } from "./dto/create-earning-action.dto";

import {
  PointHistory,
  PointHistoryType,
} from "../participant-campaign-balance/entities/point-history.entity";
import { Between, LessThan } from "typeorm";
import { MatchingPointService } from "../matching-point/services/matching-point.service";
import { MatchingPointActivityType } from "../matching-point/entities/matching-point-config.entity";
import { UserType } from "../matching-point/entities/matching-point-redemption.entity";

@Injectable()
export class ParticipantProgressionService {
  private readonly logger = new Logger(ParticipantProgressionService.name);

  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantBadge)
    private readonly badgeRepository: Repository<ParticipantBadge>,
    @InjectRepository(EarningAction)
    private readonly earningActionRepository: Repository<EarningAction>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly mailService: MailService,
    private readonly matchingPointService: MatchingPointService,
  ) {}

  // --- Action Triggering ---

  async triggerAction(
    participantId: string,
    actionKey: string,
    meta?: any,
  ): Promise<void> {
    const action = await this.earningActionRepository.findOne({
      where: { key: actionKey },
    });

    if (!action) {
      this.logger.warn(`Action key ${actionKey} not found`);
      return;
    }

    if (!action.isActive) {
      return;
    }

    // Check limits
    if (action.actionParameters) {
      const canEarn = await this.checkLimits(
        participantId,
        actionKey,
        action.actionParameters,
      );
      if (!canEarn) {
        this.logger.log(
          `Limit reached for action ${actionKey} for participant ${participantId}`,
        );
        return;
      }
    }

    if (action.points > 0) {
      await this.addMatchingPoints(
        participantId,
        action.points,
        action.name,
        actionKey,
      );
    }
  }

  private async checkLimits(
    participantId: string,
    actionKey: string,
    params: any,
  ): Promise<boolean> {
    if (params.limitType === "once_lifetime") {
      const count = await this.pointHistoryRepository.count({
        where: { participant: { id: participantId }, actionKey: actionKey },
      });
      return count === 0;
    }

    if (params.limitType === "daily") {
      const limit = params.limit || 1;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const count = await this.pointHistoryRepository.count({
        where: {
          participant: { id: participantId },
          actionKey: actionKey,
          created_at: MoreThanOrEqual(startOfDay),
        },
      });
      return count < limit;
    }

    return true;
  }

  async addMatchingPoints(
    participantId: string,
    points: number,
    reason: string,
    actionKey?: string,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["currentBadge"],
    });
    if (!participant) throw new NotFoundException("Participant not found");

    let finalPoints = points;
    if (participant.currentBadge && participant.currentBadge.multiplier > 1) {
      finalPoints = Math.floor(points * participant.currentBadge.multiplier);
    }

    // Use MatchingPointService to add points and log history (centralized)
    // We treat this as MANUAL_ADJUSTMENT type or maybe we need a new type like "PROGRESSION_REWARD"?
    // For now, let's use MANUAL_ADJUSTMENT or create a new one if possible.
    // Or reuse CAMPAIGN_CREATION? No.
    // Let's use MANUAL_ADJUSTMENT for generic system rewards if config allows,
    // BUT addPoints requires a config type.
    // If I use MatchingPointService.addPoints, it relies on config.
    // But here the points are DYNAMIC (from action definition), not fixed config.
    // So I should use manualAdjustment method of MatchingPointService which accepts arbitrary points.

    await this.matchingPointService.manualAdjustment(
      participantId,
      UserType.PARTICIPANT,
      finalPoints,
      reason,
    );

    // Reload participant to get updated balance for checkAndPromote?
    // checkAndPromote fetches participant again inside.
    await this.checkAndPromote(participantId);
  }

  // --- Promotion Logic ---

  async checkAndPromote(participantInput: Participant | string): Promise<void> {
    let participant: Participant;
    if (typeof participantInput === "string") {
      participant = await this.participantRepository.findOne({
        where: { id: participantInput },
        relations: ["currentBadge"],
      });
      if (!participant) return;
    } else {
      participant = participantInput;
    }

    const currentPoints = participant.matching_points || 0;

    // Get all badges ordered by priority ASC
    const badges = await this.badgeRepository.find({
      order: { priority: "ASC" },
    });

    let targetBadge: ParticipantBadge = null;

    // Find the highest priority badge the user qualifies for
    for (const badge of badges) {
      if (currentPoints >= badge.minPoints) {
        targetBadge = badge;
      }
    }

    // If no target badge found (e.g. points < lowest badge), or target is same/lower priority than current, do nothing
    if (!targetBadge) return;

    const currentBadgePriority = participant.currentBadge
      ? participant.currentBadge.priority
      : 0;

    if (targetBadge.priority > currentBadgePriority) {
      await this.promoteParticipant(participant, targetBadge);
    }
  }

  private async promoteParticipant(
    participant: Participant,
    newBadge: ParticipantBadge,
  ) {
    this.logger.log(
      `Promoting participant ${participant.id} to ${newBadge.name}`,
    );
    participant.currentBadge = newBadge;
    await this.participantRepository.save(participant);

    // Send Email
    try {
      await this.mailService.sendLevelPromotionEmail(
        participant.email,
        participant.name,
        newBadge.name,
        newBadge.benefits || [],
      );
    } catch (e) {
      this.logger.error(
        `Failed to send promotion email to ${participant.email}`,
        e,
      );
    }
  }

  async manualPromote(participantId: string, badgeId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["currentBadge"],
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const badge = await this.badgeRepository.findOne({
      where: { id: badgeId },
    });
    if (!badge) throw new NotFoundException("Badge level not found");

    await this.promoteParticipant(participant, badge);
  }

  // --- CRUD ---

  async createBadge(dto: CreateParticipantBadgeDto) {
    const badge = this.badgeRepository.create(dto);
    return this.badgeRepository.save(badge);
  }

  async updateBadge(id: string, dto: Partial<CreateParticipantBadgeDto>) {
    await this.badgeRepository.update(id, dto);
    return this.badgeRepository.findOne({ where: { id } });
  }

  async getBadges() {
    return this.badgeRepository.find({ order: { priority: "ASC" } });
  }

  // --- Action CRUD ---
  async createAction(dto: CreateEarningActionDto) {
    const action = this.earningActionRepository.create(dto);
    return this.earningActionRepository.save(action);
  }

  async getActions() {
    return this.earningActionRepository.find();
  }

  async updateAction(id: string, dto: Partial<CreateEarningActionDto>) {
    await this.earningActionRepository.update(id, dto);
    return this.earningActionRepository.findOne({ where: { id } });
  }

  // --- Streak & Activity ---

  async trackAppOpen(participantId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["currentBadge"],
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const now = new Date();
    const lastOpen = participant.lastAppOpenDate
      ? new Date(participant.lastAppOpenDate)
      : null;

    let isNewDay = true;
    if (lastOpen) {
      isNewDay = now.toDateString() !== lastOpen.toDateString();
    }

    if (isNewDay) {
      participant.dailyAppOpenCount = 0;
      // Check streak logic here?
      // "tracks streaks (login ...)" -> Let's handle Login Streak in triggerAction('LOGIN_DAILY') instead.
      // For App Open, we just track count.
    }

    participant.dailyAppOpenCount += 1;
    participant.lastAppOpenDate = now;

    await this.participantRepository.save(participant);

    // Award points for App Open
    // We can use the 'APP_OPEN' action key.
    // The action itself can have limits (e.g. max 5 times a day).
    await this.triggerAction(participantId, "APP_OPEN", {
      dailyCount: participant.dailyAppOpenCount,
    });
  }

  async handleLoginStreak(participantId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["currentBadge"],
    });
    if (!participant) return;

    const now = new Date();
    const lastLogin = participant.lastLoginDate
      ? new Date(participant.lastLoginDate)
      : null;

    // If logged in today already, do nothing? Or maybe we just update date.
    // Actually, triggerAction('LOGIN_DAILY') limits to once a day via PointHistory.
    // But for streak calculation, we need to know if it's a consecutive day.

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogin && lastLogin.toDateString() === now.toDateString()) {
      // Already logged in today, do nothing for streak
      return;
    }

    if (lastLogin && lastLogin.toDateString() === yesterday.toDateString()) {
      participant.currentLoginStreak += 1;
    } else {
      // Broken streak (unless first login)
      if (lastLogin) {
        // missed a day
        participant.currentLoginStreak = 1;
      } else {
        participant.currentLoginStreak = 1;
      }
    }

    participant.lastLoginDate = now;
    await this.participantRepository.save(participant);

    // Award points for streak milestones?
    // e.g. 7 days streak
    if (participant.currentLoginStreak % 7 === 0) {
      await this.triggerAction(participantId, "STREAK_7_DAY");
    }
  }

  async getMyDetailedProgression(participantId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["currentBadge"],
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    const currentPoints = participant.matching_points || 0;
    const currentBadge = participant.currentBadge;

    // Get all badges ordered by priority ASC
    const badges = await this.badgeRepository.find({
      order: { priority: "ASC" },
    });

    const currentBadgePriority = currentBadge ? currentBadge.priority : 0;

    const nextBadge = badges.find((b) => b.priority > currentBadgePriority);

    let progressPercentage = 100;
    let pointsNeeded = 0;
    let remainingPoints = 0;

    if (nextBadge) {
      const startPoints = currentBadge ? currentBadge.minPoints : 0;
      const range = nextBadge.minPoints - startPoints;
      const progressInRange = currentPoints - startPoints;

      progressPercentage = Math.min(
        100,
        Math.max(0, Math.floor((progressInRange / range) * 100)),
      );
      pointsNeeded = nextBadge.minPoints;
      remainingPoints = Math.max(0, pointsNeeded - currentPoints);
    }

    return {
      currentPoints,
      currentBadge,
      nextBadge,
      pointsNeeded,
      remainingPoints,
      progressPercentage,
      allBadges: badges,
    };
  }
}
