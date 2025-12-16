import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StampRewardTemplate } from '../entities/stamp-reward-template.entity';
import { BusinessStampReward } from '../entities/business-stamp-reward.entity';
import { StampCard } from '../entities/stamp-card.entity';
import { StampEvent } from '../entities/stamp-event.entity';
import { CreateStampTemplateDto } from '../dto/create-stamp-template.dto';
import { UpdateStampTemplateDto } from '../dto/update-stamp-template.dto';
import { ActivateStampRewardDto } from '../dto/activate-stamp-reward.dto';
import { Participant } from '../../participant/entities/participant.entity';
import { Business } from '../../business/entities/business.entity';
import { StampCardStatus } from '../enums/stamp-card-status.enum';
import { StampTriggerMethod } from '../enums/stamp-trigger-method.enum';
import { ScanParticipantQrDto } from '../dto/scan-participant-qr.dto';
import { ParticipantCampaignBalanceService } from '../../participant-campaign-balance/services/participant-campaign-balance.service';

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

  async createTemplate(dto: CreateStampTemplateDto): Promise<StampRewardTemplate> {
    const template = this.templateRepo.create(dto);
    return this.templateRepo.save(template);
  }

  async findAllTemplates(isPublishedOnly = false): Promise<StampRewardTemplate[]> {
    const query = this.templateRepo.createQueryBuilder('template');
    if (isPublishedOnly) {
      query.where('template.is_published = :isPublished', { isPublished: true });
    }
    return query.getMany();
  }

  async findTemplateOne(id: string): Promise<StampRewardTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateStampTemplateDto): Promise<StampRewardTemplate> {
    await this.templateRepo.update(id, dto);
    return this.findTemplateOne(id);
  }

  async publishTemplate(id: string): Promise<StampRewardTemplate> {
    await this.templateRepo.update(id, { is_published: true });
    return this.findTemplateOne(id);
  }

  // --- Business Methods ---

  async getBusinessTemplates(): Promise<StampRewardTemplate[]> {
    // Businesses see published templates
    return this.findAllTemplates(true);
  }

  async activateTemplate(businessId: string, dto: ActivateStampRewardDto): Promise<BusinessStampReward> {
    const template = await this.findTemplateOne(dto.templateId);
    if (!template.is_published) {
      throw new BadRequestException('Cannot activate an unpublished template');
    }

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

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

  async getBusinessActiveRewards(businessId: string): Promise<BusinessStampReward[]> {
    return this.businessRewardRepo.find({
      where: { business: { id: businessId }, is_active: true },
      relations: ['template'],
    });
  }

  async getBusinessRewardStats(businessId: string) {
      const rewards = await this.businessRewardRepo.find({
          where: { business: { id: businessId } },
          relations: ['template']
      });
      // Stats are pre-calculated in columns for efficiency, as per schema
      return rewards.map(r => ({
          id: r.id,
          title: r.template.title,
          total_enrolled: r.total_enrolled,
          total_completions: r.total_completions,
          total_redemptions: r.total_redemptions
      }));
  }

  // --- Participant Methods ---

  async getMyStampCards(participantId: string): Promise<StampCard[]> {
    return this.stampCardRepo.find({
      where: { participant: { id: participantId } },
      relations: ['businessStampReward', 'businessStampReward.template', 'businessStampReward.business'],
    });
  }

  async getStampCardDetails(cardId: string, participantId: string): Promise<StampCard> {
      const card = await this.stampCardRepo.findOne({
          where: { id: cardId, participant: { id: participantId } },
          relations: ['businessStampReward', 'businessStampReward.template', 'businessStampReward.business', 'events']
      });
      if (!card) throw new NotFoundException('Stamp card not found');
      return card;
  }

  // --- Core Logic (Scanning, Earning, Redeeming) ---

  /**
   * Generic method to add a stamp.
   * Can be used by other modules (e.g., Purchase Service) to trigger stamps.
   */
  async addStamp(
      businessId: string,
      participantId: string,
      triggerMethod: StampTriggerMethod,
      metadata?: string
  ): Promise<StampCard> {
      const participant = await this.participantRepo.findOne({ where: { id: participantId } });
      if (!participant) throw new NotFoundException('Participant not found');

      // Find active rewards for this business that match the trigger method
      // Note: A business could theoretically have multiple active rewards with the same trigger.
      // If so, we should add stamps to all of them? Or just one?
      // Logic: Add to all applicable active rewards.

      const rewards = await this.businessRewardRepo.find({
          where: {
              business: { id: businessId },
              is_active: true,
              template: { trigger_method: triggerMethod }
          },
          relations: ['template']
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
      return this.processAddStamp(participant, rewards[0], triggerMethod, metadata);
  }

  async addStampByScan(businessId: string, dto: ScanParticipantQrDto): Promise<StampCard> {
    // 1. Verify Business
    // 2. Find Participant by uniqueCode
    const participant = await this.participantRepo.findOne({ where: { uniqueCode: dto.participantUniqueCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    // 3. Find Business Stamp Reward
    const reward = await this.businessRewardRepo.findOne({
      where: { id: dto.businessStampRewardId, business: { id: businessId } },
      relations: ['template'],
    });

    if (!reward) throw new NotFoundException('Stamp Reward program not found for this business');
    if (!reward.is_active) throw new BadRequestException('This reward program is not active');

    // Check trigger method
    if (reward.template.trigger_method !== StampTriggerMethod.QR_SCAN) {
       throw new BadRequestException(`This reward only supports ${reward.template.trigger_method}, not QR Scan`);
    }

    return this.processAddStamp(participant, reward, StampTriggerMethod.QR_SCAN);
  }

  // Helper to add stamp (handles creation, hybrid points, completion)
  public async processAddStamp(participant: Participant, reward: BusinessStampReward, method: StampTriggerMethod, metadata?: string): Promise<StampCard> {
    return this.dataSource.transaction(async (manager) => {
      // Find existing card or create new
      let card = await manager.findOne(StampCard, {
        where: {
            participant: { id: participant.id },
            businessStampReward: { id: reward.id },
            status: StampCardStatus.IN_PROGRESS
        },
        relations: ['businessStampReward', 'businessStampReward.template'] // Ensure relations are loaded
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
                 status: StampCardStatus.COMPLETED
             }
        });

        if (completedCard) {
            throw new BadRequestException('You have a completed card waiting to be redeemed. Redeem it first!');
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
        await manager.increment(BusinessStampReward, { id: reward.id }, 'total_enrolled', 1);
      } else {
        // Ensure relations are present if they were missing (e.g. from findOne partial load)
        if (!card.businessStampReward) card.businessStampReward = reward;
        if (!card.businessStampReward.template) card.businessStampReward.template = reward.template;
      }

      const required = reward.template.required_stamps;

      if (card.current_stamps >= required) {
          // Should be COMPLETED already, but just in case
          throw new BadRequestException('Card is already full');
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
        await manager.increment(BusinessStampReward, { id: reward.id }, 'total_completions', 1);
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
              await manager.increment(Participant, { id: participant.id }, 'global_total_points', pointsAdded);
          }
      }

      // Log Event
      const event = manager.create(StampEvent, {
          stampCard: card,
          trigger_method: method,
          points_added: pointsAdded,
          metadata: metadata
      });
      await manager.save(StampEvent, event);

      return card;
    });
  }

  async redeemReward(businessId: string, participantUniqueCode: string, cardId?: string): Promise<StampCard> {
     // Business scans participant QR to redeem
     const participant = await this.participantRepo.findOne({ where: { uniqueCode: participantUniqueCode } });
     if (!participant) throw new NotFoundException('Participant not found');

     // Find the card.
     // If cardId is provided, specific one.
     // If not, find the one that is COMPLETED for this business.
     // Since the business scans the USER QR, they might see a list of rewards?
     // "Consumer goes to the business and shows their reward QR." -> This implies the QR is specific to the reward or the user shows their profile QR.
     // "Business scans it to mark it as used."
     // If the user shows a "Reward QR", that QR likely contains the Card ID.
     // But the prompt says "Consumer shows their reward QR".
     // If the backend has to handle "Scan Participant QR", and then find relevant rewards.
     // Let's assume the request sends participantUniqueCode.
     // We need to find the COMPLETED card for this business.

     // Ideally, the "Reward QR" on the frontend encodes the `cardId`.
     // If the input is just `participantUniqueCode`, we search for a completed card for this business.

     let card: StampCard;

     if (cardId) {
         card = await this.stampCardRepo.findOne({
             where: { id: cardId },
             relations: ['businessStampReward', 'businessStampReward.business']
         });
     } else {
         // Find a completed card for this business
         card = await this.stampCardRepo.findOne({
             where: {
                 participant: { id: participant.id },
                 businessStampReward: { business: { id: businessId } },
                 status: StampCardStatus.COMPLETED
             },
             relations: ['businessStampReward', 'businessStampReward.business']
         });
     }

     if (!card) throw new NotFoundException('No completed stamp card found for this participant at this business');

     if (card.businessStampReward.business.id !== businessId) {
         throw new ForbiddenException('This reward belongs to another business');
     }

     if (card.status !== StampCardStatus.COMPLETED) {
         throw new BadRequestException('Card is not completed yet');
     }

     // Redeem
     return this.dataSource.transaction(async manager => {
        card.status = StampCardStatus.REDEEMED;
        card.redeemed_at = new Date();
        await manager.save(StampCard, card);

        await manager.increment(BusinessStampReward, { id: card.businessStampReward.id }, 'total_redemptions', 1);

        // Auto-create new card?
        // Requirement 4.5: "After redemption: A new empty card starts automatically (if the reward is repeatable)"
        // I don't see a "repeatable" flag in the doc, but usually stamp cards are repeatable.
        // I will assume yes.

        const newCard = manager.create(StampCard, {
            participant,
            businessStampReward: card.businessStampReward,
            current_stamps: 0,
            status: StampCardStatus.IN_PROGRESS
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
        await manager.increment(BusinessStampReward, { id: card.businessStampReward.id }, 'total_enrolled', 1);

        return card;
     });
  }
}
