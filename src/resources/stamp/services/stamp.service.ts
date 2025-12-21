import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { StampRewardTemplate } from "../entities/stamp-reward-template.entity";
import { BusinessStampReward } from "../entities/business-stamp-reward.entity";
import { StampCard } from "../entities/stamp-card.entity";
import { StampEvent } from "../entities/stamp-event.entity";
import { CreateStampTemplateDto } from "../dto/create-stamp-template.dto";
import { UpdateStampTemplateDto } from "../dto/update-stamp-template.dto";
import { ActivateStampRewardDto } from "../dto/activate-stamp-reward.dto";
import { Participant } from "../../participant/entities/participant.entity";
import { Business } from "../../business/entities/business.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Role } from "../../../common/role.enum";
import { StampCardStatus } from "../enums/stamp-card-status.enum";
import { StampTriggerMethod } from "../enums/stamp-trigger-method.enum";
import { ScanParticipantQrDto } from "../dto/scan-participant-qr.dto";
import { ParticipantCampaignBalanceService } from "../../participant-campaign-balance/services/participant-campaign-balance.service";

@Injectable()
export class StampService {
  constructor(
    @InjectRepository(StampRewardTemplate)
    private templateRepo: Repository<StampRewardTemplate>,
    @InjectRepository(BusinessStampReward)
    private businessRewardRepo: Repository<BusinessStampReward>,
    @InjectRepository(StampCard)
    private stampCardRepo: Repository<StampCard>,
    @InjectRepository(StampEvent)
    private stampEventRepo: Repository<StampEvent>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    private dataSource: DataSource,
    // Assuming this service exists and can add points.
    // Ideally we should use a PointService or similar if it's generic,
    // but the instruction mentions hybrid mode adds points to consumer wallet.
    // If ParticipantCampaignBalanceService is strictly for campaigns, we might need to check if there's a Global Point service.
    // Based on memory, Participant has `global_total_points`.
    // I'll assume we can update `participant.global_total_points` or use a service.
    // Since `ParticipantCampaignBalance` is about campaigns, and Stamps are separate,
    // I will check if there is a generic point earning service or if I should update Participant directly.
    // For now, I will update Participant directly in a transaction or use a suitable service if found.
  ) {}

  // --- Admin Methods ---

  async createTemplate(
    dto: CreateStampTemplateDto,
  ): Promise<StampRewardTemplate> {
    const template = this.templateRepo.create(dto);
    return this.templateRepo.save(template);
  }

  async findAllTemplates(
    isPublishedOnly = false,
  ): Promise<StampRewardTemplate[]> {
    const query = this.templateRepo.createQueryBuilder("template");
    if (isPublishedOnly) {
      query.where("template.is_published = :isPublished", {
        isPublished: true,
      });
    } else {
      // Admins should see everything, but maybe filter out archived?
      // "Delete" usually implies soft-delete or hard-delete.
      // "Archive" implies hiding.
      // Let's assume list shows non-archived by default unless specified?
      // Or admins see all. Let's return all for admins for now.
    }
    return query.getMany();
  }

  async findTemplateOne(id: string): Promise<StampRewardTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException("Template not found");
    return template;
  }

  async updateTemplate(
    id: string,
    dto: UpdateStampTemplateDto,
  ): Promise<StampRewardTemplate> {
    await this.templateRepo.update(id, dto);
    return this.findTemplateOne(id);
  }

  async publishTemplate(id: string): Promise<StampRewardTemplate> {
    await this.templateRepo.update(id, { is_published: true });
    return this.findTemplateOne(id);
  }

  async deleteTemplate(id: string): Promise<void> {
    // Soft delete
    await this.templateRepo.softDelete(id);
  }

  async archiveTemplate(id: string): Promise<StampRewardTemplate> {
    await this.templateRepo.update(id, {
      is_archived: true,
      is_published: false,
    });
    return this.findTemplateOne(id);
  }

  async duplicateTemplate(id: string): Promise<StampRewardTemplate> {
    const original = await this.findTemplateOne(id);
    const { id: _, created_at, updated_at, deleted_at, ...data } = original;
    const duplicate = this.templateRepo.create({
      ...data,
      title: `${original.title} (Copy)`,
      is_published: false,
      is_archived: false,
    });
    return this.templateRepo.save(duplicate);
  }

  // --- Business Methods ---

  async getBusinessTemplates(): Promise<StampRewardTemplate[]> {
    // Businesses see published templates
    return this.findAllTemplates(true);
  }

  async activateTemplate(
    businessId: string,
    dto: ActivateStampRewardDto,
  ): Promise<BusinessStampReward> {
    const template = await this.findTemplateOne(dto.templateId);
    if (!template.is_published) {
      throw new BadRequestException("Cannot activate an unpublished template");
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException("Business not found");

    // Check if already active? The requirement doesn't explicitly forbid multiple activations, but usually it's one per template.
    // "Business Stamp Reward UI Flow" implies they can have multiple.

    const businessReward = this.businessRewardRepo.create({
      template,
      business,
      custom_image: dto.custom_image || template.default_image,
      operating_hours: dto.operating_hours,
      is_active: true,
    });

    return this.businessRewardRepo.save(businessReward);
  }

  async getBusinessActiveRewards(
    businessId: string,
  ): Promise<BusinessStampReward[]> {
    return this.businessRewardRepo.find({
      where: { business: { id: businessId }, is_active: true },
      relations: ["template"],
    });
  }

  async getBusinessRewardStats(businessId: string) {
    const rewards = await this.businessRewardRepo.find({
      where: { business: { id: businessId } },
      relations: ["template"],
    });
    // Stats are pre-calculated in columns for efficiency, as per schema
    return rewards.map((r) => ({
      id: r.id,
      title: r.template.title,
      total_enrolled: r.total_enrolled,
      total_completions: r.total_completions,
      total_redemptions: r.total_redemptions,
    }));
  }

  async pauseReward(
    businessId: string,
    rewardId: string,
  ): Promise<BusinessStampReward> {
    const reward = await this.businessRewardRepo.findOne({
      where: { id: rewardId, business: { id: businessId } },
    });
    if (!reward) throw new NotFoundException("Reward not found");
    reward.is_active = false;
    return this.businessRewardRepo.save(reward);
  }

  async resumeReward(
    businessId: string,
    rewardId: string,
  ): Promise<BusinessStampReward> {
    const reward = await this.businessRewardRepo.findOne({
      where: { id: rewardId, business: { id: businessId } },
    });
    if (!reward) throw new NotFoundException("Reward not found");
    reward.is_active = true;
    return this.businessRewardRepo.save(reward);
  }

  async deactivateReward(businessId: string, rewardId: string): Promise<void> {
    const reward = await this.businessRewardRepo.findOne({
      where: { id: rewardId, business: { id: businessId } },
    });
    if (!reward) throw new NotFoundException("Reward not found");
    await this.businessRewardRepo.softDelete(rewardId);
  }

  async getRewardCustomers(
    businessId: string,
    rewardId: string,
  ): Promise<StampCard[]> {
    // Return cards with participant details
    return this.stampCardRepo.find({
      where: {
        businessStampReward: {
          id: rewardId,
          business: { id: businessId },
        },
      },
      relations: ["participant"],
    });
  }

  // --- Participant Methods ---

  async getMyStampCards(participantId: string): Promise<StampCard[]> {
    // Use QueryBuilder to include soft-deleted BusinessStampRewards (history)
    // while ensuring the StampCard itself is not deleted.
    return this.stampCardRepo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.businessStampReward", "reward")
      .leftJoinAndSelect("reward.template", "template")
      .leftJoinAndSelect("reward.business", "business")
      .where("card.participantId = :participantId", { participantId })
      .andWhere("card.deleted_at IS NULL")
      .withDeleted() // Allows fetching relations that are soft-deleted
      .getMany();
  }

  async getStampCardDetails(
    cardId: string,
    participantId: string,
  ): Promise<StampCard> {
    const card = await this.stampCardRepo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.businessStampReward", "reward")
      .leftJoinAndSelect("reward.template", "template")
      .leftJoinAndSelect("reward.business", "business")
      .leftJoinAndSelect("card.events", "events")
      .where("card.id = :cardId", { cardId })
      .andWhere("card.participantId = :participantId", { participantId })
      .andWhere("card.deleted_at IS NULL")
      .withDeleted()
      .getOne();

    if (!card) throw new NotFoundException("Stamp card not found");
    return card;
  }

  async discoverRewards(): Promise<BusinessStampReward[]> {
    // Business is considered onboarded if sector is not null.
    // But we can't easily query "sector IS NOT NULL" in FindOptions where object without using IsNull().
    // Using query builder for robustness.
    return this.businessRewardRepo
      .createQueryBuilder("reward")
      .leftJoinAndSelect("reward.template", "template")
      .leftJoinAndSelect("reward.business", "business")
      .where("reward.is_active = :isActive", { isActive: true })
      .andWhere("business.sectorId IS NOT NULL")
      .getMany();
  }

  async startCard(
    participantId: string,
    businessStampRewardId: string,
  ): Promise<StampCard> {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const reward = await this.businessRewardRepo.findOne({
      where: { id: businessStampRewardId },
      relations: ["template"],
    });
    if (!reward || !reward.is_active)
      throw new NotFoundException("Reward not found or inactive");

    // Check if already exists
    const existing = await this.stampCardRepo.findOne({
      where: {
        participant: { id: participantId },
        businessStampReward: { id: businessStampRewardId },
        status: StampCardStatus.IN_PROGRESS,
      },
    });

    if (existing) return existing;

    // Check if they have a completed one that needs redeeming?
    const completed = await this.stampCardRepo.findOne({
      where: {
        participant: { id: participantId },
        businessStampReward: { id: businessStampRewardId },
        status: StampCardStatus.COMPLETED,
      },
    });
    if (completed)
      throw new BadRequestException(
        "You have a completed card waiting to be redeemed",
      );

    const newCard = this.stampCardRepo.create({
      participant,
      businessStampReward: reward,
      current_stamps: 0,
      status: StampCardStatus.IN_PROGRESS,
    });

    await this.businessRewardRepo.increment(
      { id: reward.id },
      "total_enrolled",
      1,
    );
    return this.stampCardRepo.save(newCard);
  }

  async getParticipantStats(participantId: string) {
    const cards = await this.stampCardRepo.find({
      where: { participant: { id: participantId } },
    });
    const completed = cards.filter(
      (c) =>
        c.status === StampCardStatus.COMPLETED ||
        c.status === StampCardStatus.REDEEMED,
    ).length;
    const inProgress = cards.filter(
      (c) => c.status === StampCardStatus.IN_PROGRESS,
    ).length;
    return {
      total_cards: cards.length,
      completed_cards: completed,
      in_progress_cards: inProgress,
    };
  }

  // --- Core Logic (Scanning, Earning, Redeeming) ---

  /**
   * Resolves the Business ID for a given user (Business Owner or Staff).
   */
  async resolveBusinessId(userId: string, role: string): Promise<string> {
    if (role === Role.Business) {
      return userId;
    } else if (role === Role.Staff) {
      const staff = await this.staffRepo.findOne({
        where: { id: userId },
        relations: ["business"],
      });
      if (!staff || !staff.business)
        throw new ForbiddenException("Staff not associated with a business");
      return staff.business.id;
    }
    throw new ForbiddenException(
      `Invalid role for business operations: ${role}`,
    );
  }

  /**
   * Generic method to add a stamp.
   * Can be used by other modules (e.g., Purchase Service) to trigger stamps.
   */
  async addStamp(
    businessId: string,
    participantId: string,
    triggerMethod: StampTriggerMethod,
    metadata?: string,
  ): Promise<StampCard> {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    // Find active rewards for this business that match the trigger method
    // Note: A business could theoretically have multiple active rewards with the same trigger.
    // If so, we should add stamps to all of them? Or just one?
    // Logic: Add to all applicable active rewards.

    const rewards = await this.businessRewardRepo.find({
      where: {
        business: { id: businessId },
        is_active: true,
        template: { trigger_method: triggerMethod },
      },
      relations: ["template"],
    });

    if (rewards.length === 0) {
      // No rewards triggered
      // We don't throw error here because this might be called as a side-effect of a purchase,
      // and we don't want to fail the purchase if no stamp is available.
      // But if called explicitly for scanning, we might want to know.
      // For now, return null or empty array if we were returning list.
      // But the signature returns Promise<StampCard>.
      // This implies a single card.
      // If we support multiple rewards, we should return StampCard[].
      // For the specific case of Scan, we usually target a specific reward or just "scan for stamps".
      // The current implementation of `addStampByScan` targets a specific reward ID.
      // Let's keep `addStamp` focused on a specific reward if possible, or handle the ambiguity.

      // If this method is "Generic Trigger", it should probably find ALL matching rewards and update them.
      return null;
    }

    // For simplicity in this iteration, and matching the requirement "Business scans customer QR to give stamp",
    // we will process the first matching reward or we need to refine the requirement.
    // However, `addStampByScan` is specific.
    // Let's implement `processAddStamp` as the public generic logic that takes a specific reward.

    // Let's overload or create a bulk method if needed.
    // For now, I will expose `processAddStamp` logic via a public method that takes a reward.
    return this.processAddStamp(
      participant,
      rewards[0],
      triggerMethod,
      metadata,
    );
  }

  async addStampByScan(
    businessId: string,
    dto: ScanParticipantQrDto,
  ): Promise<StampCard> {
    // 1. Verify Business
    // 2. Find Participant (either by code or ID)
    let participant: Participant;
    if (dto.customerId) {
      participant = await this.participantRepo.findOne({
        where: { id: dto.customerId },
      });
    } else if (dto.participantUniqueCode) {
      participant = await this.participantRepo.findOne({
        where: { uniqueCode: dto.participantUniqueCode },
      });
    } else {
      throw new BadRequestException(
        "Either participantUniqueCode or customerId must be provided",
      );
    }

    if (!participant) throw new NotFoundException("Participant not found");

    // 3. Find Business Stamp Reward
    const reward = await this.businessRewardRepo.findOne({
      where: { id: dto.businessStampRewardId, business: { id: businessId } },
      relations: ["template"],
    });

    if (!reward)
      throw new NotFoundException(
        "Stamp Reward program not found for this business",
      );
    if (!reward.is_active)
      throw new BadRequestException("This reward program is not active");

    // Check trigger method
    if (reward.template.trigger_method !== StampTriggerMethod.QR_SCAN) {
      throw new BadRequestException(
        `This reward only supports ${reward.template.trigger_method}, not QR Scan`,
      );
    }

    return this.processAddStamp(
      participant,
      reward,
      StampTriggerMethod.QR_SCAN,
    );
  }

  // Helper to add stamp (handles creation, hybrid points, completion)
  public async processAddStamp(
    participant: Participant,
    reward: BusinessStampReward,
    method: StampTriggerMethod,
    metadata?: string,
  ): Promise<StampCard> {
    return this.dataSource.transaction(async (manager) => {
      // Find existing card or create new
      let card = await manager.findOne(StampCard, {
        where: {
          participant: { id: participant.id },
          businessStampReward: { id: reward.id },
          status: StampCardStatus.IN_PROGRESS,
        },
        relations: ["businessStampReward", "businessStampReward.template"], // Ensure relations are loaded
      });

      let isNew = false;
      if (!card) {
        // Check if there are completed but unredeemed cards?
        // Usually, users can only have one active card per reward at a time.
        // If they have a completed one, they must redeem it before starting a new one?
        // Requirement 4.5: "After redemption: A new empty card starts automatically".
        // So if they have a 'COMPLETED' card, maybe they can't earn more stamps until they redeem?
        // Or they can have multiple?
        // "System checks if they already have a card. If not, creates new."
        // I'll assume one active card at a time.

        const completedCard = await manager.findOne(StampCard, {
          where: {
            participant: { id: participant.id },
            businessStampReward: { id: reward.id },
            status: StampCardStatus.COMPLETED,
          },
        });

        if (completedCard) {
          throw new BadRequestException(
            "You have a completed card waiting to be redeemed. Redeem it first!",
          );
        }

        card = manager.create(StampCard, {
          participant,
          businessStampReward: reward,
          current_stamps: 0,
          status: StampCardStatus.IN_PROGRESS,
        });
        card = await manager.save(StampCard, card); // Save to get ID
        isNew = true;

        // Update enrolled count
        await manager.increment(
          BusinessStampReward,
          { id: reward.id },
          "total_enrolled",
          1,
        );
      } else {
        // Ensure relations are present if they were missing (e.g. from findOne partial load)
        if (!card.businessStampReward) card.businessStampReward = reward;
        if (!card.businessStampReward.template)
          card.businessStampReward.template = reward.template;
      }

      const required = reward.template.required_stamps;

      if (card.current_stamps >= required) {
        // Should be COMPLETED already, but just in case
        throw new BadRequestException("Card is already full");
      }

      // Add Stamp
      card.current_stamps += 1;

      // Check for completion
      let justCompleted = false;
      if (card.current_stamps >= required) {
        card.status = StampCardStatus.COMPLETED;
        card.completed_at = new Date();
        justCompleted = true;

        // Update completion stats
        await manager.increment(
          BusinessStampReward,
          { id: reward.id },
          "total_completions",
          1,
        );
      }

      await manager.save(StampCard, card);

      // Hybrid Logic: Points per stamp
      let pointsAdded = 0;
      if (reward.template.is_hybrid) {
        pointsAdded += reward.template.hybrid_points_per_stamp;

        if (justCompleted) {
          pointsAdded += reward.template.hybrid_completion_bonus_points;
        }

        if (pointsAdded > 0) {
          // Add points to participant global wallet
          // Assuming direct update for now as I don't have a wallet service interface in context
          await manager.increment(
            Participant,
            { id: participant.id },
            "global_total_points",
            pointsAdded,
          );
        }
      }

      // Log Event
      const event = manager.create(StampEvent, {
        stampCard: card,
        trigger_method: method,
        points_added: pointsAdded,
        metadata: metadata,
      });
      await manager.save(StampEvent, event);

      return card;
    });
  }

  async redeemReward(
    businessId: string,
    participantUniqueCode?: string,
    cardId?: string,
  ): Promise<StampCard> {
    let card: StampCard;

    if (cardId) {
      card = await this.stampCardRepo.findOne({
        where: { id: cardId },
        relations: [
          "businessStampReward",
          "businessStampReward.business",
          "participant",
        ],
      });
    } else if (participantUniqueCode) {
      const participant = await this.participantRepo.findOne({
        where: { uniqueCode: participantUniqueCode },
      });
      if (!participant) throw new NotFoundException("Participant not found");

      // Find a completed card for this business
      card = await this.stampCardRepo.findOne({
        where: {
          participant: { id: participant.id },
          businessStampReward: { business: { id: businessId } },
          status: StampCardStatus.COMPLETED,
        },
        relations: [
          "businessStampReward",
          "businessStampReward.business",
          "participant",
        ],
      });
    } else {
      throw new BadRequestException(
        "Either participantUniqueCode or stampCardId must be provided",
      );
    }

    if (!card) throw new NotFoundException("No completed stamp card found");

    if (card.businessStampReward.business.id !== businessId) {
      throw new ForbiddenException("This reward belongs to another business");
    }

    if (card.status !== StampCardStatus.COMPLETED) {
      throw new BadRequestException("Card is not completed yet");
    }

    // Redeem
    return this.dataSource.transaction(async (manager) => {
      card.status = StampCardStatus.REDEEMED;
      card.redeemed_at = new Date();
      await manager.save(StampCard, card);

      await manager.increment(
        BusinessStampReward,
        { id: card.businessStampReward.id },
        "total_redemptions",
        1,
      );

      // Auto-create new card?
      // Requirement 4.5: "After redemption: A new empty card starts automatically (if the reward is repeatable)"
      // I don't see a "repeatable" flag in the doc, but usually stamp cards are repeatable.
      // I will assume yes.

      // Ensure participant relation is present
      const participant = card.participant;

      const newCard = manager.create(StampCard, {
        participant,
        businessStampReward: card.businessStampReward,
        current_stamps: 0,
        status: StampCardStatus.IN_PROGRESS,
      });
      await manager.save(StampCard, newCard);

      // Update enrolled count?
      // Technically they were already enrolled.
      // "Total customers enrolled" might mean "Active cards" or "Unique customers".
      // Usually it's active cards.
      // If I count active cards, then +1.
      // If unique users, no change.
      // "Total customers enrolled" -> "Customers".
      // I'll stick to +1 enrolled if we consider a new card as a new enrollment instance,
      // or just leave it if it means unique people.
      // Given simple counters, let's just increment enrolled to track volume of cards started.
      await manager.increment(
        BusinessStampReward,
        { id: card.businessStampReward.id },
        "total_enrolled",
        1,
      );

      return card;
    });
  }
}
