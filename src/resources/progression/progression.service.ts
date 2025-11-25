import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLevel } from './entities/business-level.entity';
import { CustomerBadge } from './entities/customer-badge.entity';
import { BusinessProgression } from './entities/business-progression.entity';
import { CustomerProgression } from './entities/customer-progression.entity';
import { ProgressionHistory, ProgressionEntityType, ProgressionChangeReason } from './entities/progression-history.entity';
import { Business } from '../business/entities/business.entity';
import { Participant } from '../participant/entities/participant.entity';
import { CreateBusinessLevelDto } from './dto/create-business-level.dto';
import { UpdateBusinessLevelDto } from './dto/update-business-level.dto';
import { CreateCustomerBadgeDto } from './dto/create-customer-badge.dto';
import { UpdateCustomerBadgeDto } from './dto/update-customer-badge.dto';

@Injectable()
export class ProgressionService implements OnModuleInit {
    constructor(
        @InjectRepository(BusinessLevel)
        private businessLevelRepo: Repository<BusinessLevel>,
        @InjectRepository(CustomerBadge)
        private customerBadgeRepo: Repository<CustomerBadge>,
        @InjectRepository(BusinessProgression)
        private businessProgressionRepo: Repository<BusinessProgression>,
        @InjectRepository(CustomerProgression)
        private customerProgressionRepo: Repository<CustomerProgression>,
        @InjectRepository(ProgressionHistory)
        private historyRepo: Repository<ProgressionHistory>,
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,
        @InjectRepository(Participant)
        private participantRepo: Repository<Participant>,
    ) { }

    async onModuleInit() {
        await this.seedBusinessLevels();
        await this.seedCustomerBadges();
    }

    private async seedBusinessLevels() {
        const count = await this.businessLevelRepo.count();
        if (count > 0) return;

        const levels = [
            { name: 'Starter', minPoints: 0, maxPoints: 1000, minCampaigns: 0, maxCampaigns: 5, description: 'The Beginning', privileges: ['Basic Analytics', 'Standard Support'] },
            { name: 'Active', minPoints: 1001, maxPoints: 5000, minCampaigns: 6, maxCampaigns: 20, description: 'Building Momentum', privileges: ['Advanced Analytics', 'Priority Support', 'Early Access'] },
            { name: 'Trusted', minPoints: 5001, maxPoints: 10000, minCampaigns: 21, maxCampaigns: 50, description: 'Established Reliability', privileges: ['Dedicated Account Manager', 'Custom Branding'] },
            { name: 'Partner', minPoints: 10001, maxPoints: null, minCampaigns: 51, maxCampaigns: null, description: 'The Pinnacle', privileges: ['Co-marketing Opportunities', 'Exclusive Beta Access'] },
        ];

        for (const level of levels) {
            await this.businessLevelRepo.save(this.businessLevelRepo.create(level));
        }
    }

    private async seedCustomerBadges() {
        const count = await this.customerBadgeRepo.count();
        if (count > 0) return;

        const badges = [
            { name: 'Bronze', minPoints: 0, maxPoints: 500, minCampaignsJoined: 0, maxCampaignsJoined: 2, description: 'The Entry Point', privileges: ['Standard Rewards Access'] },
            { name: 'Silver', minPoints: 501, maxPoints: 2000, minCampaignsJoined: 3, maxCampaignsJoined: 10, description: 'Consistent Engagement', privileges: ['Exclusive Discounts', 'Birthday Bonus'] },
            { name: 'Gold', minPoints: 2001, maxPoints: 5000, minCampaignsJoined: 11, maxCampaignsJoined: 25, description: 'High-Value Participation', privileges: ['Priority Customer Service', 'Early Access to Deals'] },
            { name: 'Platinum', minPoints: 5001, maxPoints: null, minCampaignsJoined: 26, maxCampaignsJoined: null, description: 'The Elite Level', privileges: ['Personalized Offers', 'VIP Event Invitations'] },
        ];

        for (const badge of badges) {
            await this.customerBadgeRepo.save(this.customerBadgeRepo.create(badge));
        }
    }

    // --- Business Logic ---

    async getBusinessProgression(businessId: string) {
        let progression = await this.businessProgressionRepo.findOne({
            where: { businessId },
            relations: ['currentLevel'],
        });

        if (!progression) {
            // Initialize if not exists
            const business = await this.businessRepo.findOne({ where: { id: businessId }, relations: ['campaigns'] });
            if (!business) throw new NotFoundException('Business not found');

            const starterLevel = await this.businessLevelRepo.findOne({ where: { name: 'Starter' } });
            progression = this.businessProgressionRepo.create({
                businessId,
                currentLevel: starterLevel,
                currentPoints: Number(business.reputation_points || 0),
                totalCampaignsCreated: business.campaigns ? business.campaigns.length : 0,
            });
            await this.businessProgressionRepo.save(progression);

            // Log initial assignment
            await this.logHistory(ProgressionEntityType.BUSINESS, businessId, null, null, starterLevel.id, starterLevel.name, ProgressionChangeReason.INITIAL_ASSIGNMENT, 'SYSTEM');
        }

        return progression;
    }

    async checkAndUpdateBusinessTier(businessId: string) {
        const progression = await this.getBusinessProgression(businessId);
        if (progression.isManualOverride) return progression;

        const business = await this.businessRepo.findOne({ where: { id: businessId }, relations: ['campaigns'] });
        const points = Number(business.reputation_points || 0);
        const campaigns = business.campaigns ? business.campaigns.length : 0;

        // Update stats
        progression.currentPoints = points;
        progression.totalCampaignsCreated = campaigns;

        const levels = await this.businessLevelRepo.find({ order: { minPoints: 'ASC' } });
        let newLevel = progression.currentLevel;

        for (const level of levels) {
            if (points >= level.minPoints && campaigns >= level.minCampaigns) {
                // Only upgrade if the new level is higher (based on minPoints)
                if (level.minPoints > newLevel.minPoints) {
                    newLevel = level;
                }
            }
        }

        // Only upgrade, never downgrade automatically
        if (newLevel.id !== progression.currentLevel.id && newLevel.minPoints > progression.currentLevel.minPoints) {
            const oldLevel = progression.currentLevel;
            progression.currentLevel = newLevel;
            await this.businessProgressionRepo.save(progression);

            await this.logHistory(ProgressionEntityType.BUSINESS, businessId, oldLevel.id, oldLevel.name, newLevel.id, newLevel.name, ProgressionChangeReason.AUTOMATIC_UPGRADE, 'SYSTEM');
        } else {
            await this.businessProgressionRepo.save(progression); // Save stats update
        }

        return progression;
    }

    async overrideBusinessTier(businessId: string, levelId: string, adminId: string) {
        const progression = await this.getBusinessProgression(businessId);
        const newLevel = await this.businessLevelRepo.findOne({ where: { id: levelId } });
        if (!newLevel) throw new NotFoundException('Level not found');

        const oldLevel = progression.currentLevel;
        progression.currentLevel = newLevel;
        progression.isManualOverride = true;
        await this.businessProgressionRepo.save(progression);

        await this.logHistory(ProgressionEntityType.BUSINESS, businessId, oldLevel.id, oldLevel.name, newLevel.id, newLevel.name, ProgressionChangeReason.MANUAL_OVERRIDE, adminId);
        return progression;
    }

    async updateBusinessLevel(id: string, dto: UpdateBusinessLevelDto) {
        await this.businessLevelRepo.update(id, dto);
        return this.businessLevelRepo.findOne({ where: { id } });
    }

    async deleteBusinessLevel(id: string) {
        const level = await this.businessLevelRepo.findOne({ where: { id } });
        if (!level) throw new NotFoundException('Business level not found');
        return this.businessLevelRepo.delete(id);
    }

    // --- Customer Logic ---

    async getCustomerProgression(participantId: string) {
        let progression = await this.customerProgressionRepo.findOne({
            where: { participantId },
            relations: ['currentBadge'],
        });

        if (!progression) {
            const participant = await this.participantRepo.findOne({ where: { id: participantId }, relations: ['campaigns'] });
            if (!participant) throw new NotFoundException('Participant not found');

            const bronzeBadge = await this.customerBadgeRepo.findOne({ where: { name: 'Bronze' } });
            progression = this.customerProgressionRepo.create({
                participantId,
                currentBadge: bronzeBadge,
                currentPoints: Number(participant.global_total_points || 0),
                totalCampaignsJoined: participant.campaigns ? participant.campaigns.length : 0,
            });
            await this.customerProgressionRepo.save(progression);

            await this.logHistory(ProgressionEntityType.CUSTOMER, participantId, null, null, bronzeBadge.id, bronzeBadge.name, ProgressionChangeReason.INITIAL_ASSIGNMENT, 'SYSTEM');
        }
        return progression;
    }

    async checkAndUpdateCustomerBadge(participantId: string) {
        const progression = await this.getCustomerProgression(participantId);
        if (progression.isManualOverride) return progression;

        const participant = await this.participantRepo.findOne({ where: { id: participantId }, relations: ['campaigns'] });
        const points = Number(participant.global_total_points || 0);
        const campaigns = participant.campaigns ? participant.campaigns.length : 0;

        progression.currentPoints = points;
        progression.totalCampaignsJoined = campaigns;

        const badges = await this.customerBadgeRepo.find({ order: { minPoints: 'ASC' } });
        let newBadge = progression.currentBadge;

        for (const badge of badges) {
            if (points >= badge.minPoints && campaigns >= badge.minCampaignsJoined) {
                if (badge.minPoints > newBadge.minPoints) {
                    newBadge = badge;
                }
            }
        }

        if (newBadge.id !== progression.currentBadge.id && newBadge.minPoints > progression.currentBadge.minPoints) {
            const oldBadge = progression.currentBadge;
            progression.currentBadge = newBadge;
            await this.customerProgressionRepo.save(progression);

            await this.logHistory(ProgressionEntityType.CUSTOMER, participantId, oldBadge.id, oldBadge.name, newBadge.id, newBadge.name, ProgressionChangeReason.AUTOMATIC_UPGRADE, 'SYSTEM');
        } else {
            await this.customerProgressionRepo.save(progression);
        }

        return progression;
    }

    async overrideCustomerBadge(participantId: string, badgeId: string, adminId: string) {
        const progression = await this.getCustomerProgression(participantId);
        const newBadge = await this.customerBadgeRepo.findOne({ where: { id: badgeId } });
        if (!newBadge) throw new NotFoundException('Badge not found');

        const oldBadge = progression.currentBadge;
        progression.currentBadge = newBadge;
        progression.isManualOverride = true;
        await this.customerProgressionRepo.save(progression);

        await this.logHistory(ProgressionEntityType.CUSTOMER, participantId, oldBadge.id, oldBadge.name, newBadge.id, newBadge.name, ProgressionChangeReason.MANUAL_OVERRIDE, adminId);
        return progression;
    }

    async updateCustomerBadge(id: string, dto: UpdateCustomerBadgeDto) {
        await this.customerBadgeRepo.update(id, dto);
        return this.customerBadgeRepo.findOne({ where: { id } });
    }

    async deleteCustomerBadge(id: string) {
        const badge = await this.customerBadgeRepo.findOne({ where: { id } });
        if (!badge) throw new NotFoundException('Customer badge not found');
        return this.customerBadgeRepo.delete(id);
    }

    async createBusinessLevel(dto: CreateBusinessLevelDto) {
        const level = this.businessLevelRepo.create(dto);
        return this.businessLevelRepo.save(level);
    }

    async createCustomerBadge(dto: CreateCustomerBadgeDto) {
        const badge = this.customerBadgeRepo.create(dto);
        return this.customerBadgeRepo.save(badge);
    }

    // --- History ---

    async getHistory(entityType: ProgressionEntityType, entityId: string) {
        return this.historyRepo.find({
            where: { entityType, entityId },
            order: { created_at: 'DESC' },
        });
    }

    private async logHistory(
        entityType: ProgressionEntityType,
        entityId: string,
        fromLevelId: string | null,
        fromLevelName: string | null,
        toLevelId: string,
        toLevelName: string,
        reason: ProgressionChangeReason,
        changedBy: string,
    ) {
        await this.historyRepo.save({
            entityType,
            entityId,
            fromLevelId,
            fromLevelName,
            toLevelId,
            toLevelName,
            reason,
            changedBy,
        });
    }

    async getAllBusinessLevels() {
        return this.businessLevelRepo.find({ order: { minPoints: 'ASC' } });
    }

    async getAllCustomerBadges() {
        return this.customerBadgeRepo.find({ order: { minPoints: 'ASC' } });
    }
}
