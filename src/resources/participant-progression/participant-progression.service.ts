import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Participant } from '../participant/entities/participant.entity';
import { ParticipantBadge } from './entities/participant-badge.entity';
import { EarningAction } from './entities/earning-action.entity';
import { CreateParticipantBadgeDto } from './dto/create-participant-badge.dto';
import { MailService } from '../../mail/mail.service';
import { CreateEarningActionDto } from './dto/create-earning-action.dto';

import { PointHistory, PointHistoryType } from '../participant-campaign-balance/entities/point-history.entity';
import { Between, LessThan } from 'typeorm';

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
    ) { }

    // --- Action Triggering ---

    async triggerAction(participantId: string, actionKey: string, meta?: any): Promise<void> {
        const action = await this.earningActionRepository.findOne({ where: { key: actionKey } });

        if (!action) {
            this.logger.warn(`Action key ${actionKey} not found`);
            return;
        }

        if (!action.isActive) {
            return;
        }

        // Check limits
        if (action.actionParameters) {
            const canEarn = await this.checkLimits(participantId, actionKey, action.actionParameters);
            if (!canEarn) {
                this.logger.log(`Limit reached for action ${actionKey} for participant ${participantId}`);
                return;
            }
        }

        if (action.points > 0) {
            await this.addMatchingPoints(participantId, action.points, action.name, actionKey);
        }
    }

    private async checkLimits(participantId: string, actionKey: string, params: any): Promise<boolean> {
        if (params.limitType === 'once_lifetime') {
            const count = await this.pointHistoryRepository.count({
                where: { participant: { id: participantId }, actionKey: actionKey }
            });
            return count === 0;
        }

        if (params.limitType === 'daily') {
            const limit = params.limit || 1;
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const count = await this.pointHistoryRepository.count({
                where: {
                    participant: { id: participantId },
                    actionKey: actionKey,
                    created_at: MoreThanOrEqual(startOfDay)
                }
            });
            return count < limit;
        }

        return true;
    }

    async addMatchingPoints(participantId: string, points: number, reason: string, actionKey?: string): Promise<void> {
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['currentBadge'] });
    }

    // --- Promotion Logic ---

    async checkAndPromote(participantInput: Participant | string): Promise<void> {
        let participant: Participant;
        if (typeof participantInput === 'string') {
            participant = await this.participantRepository.findOne({ where: { id: participantInput }, relations: ['currentBadge'] });
            if (!participant) return;
        } else {
            participant = participantInput;
        }

        const currentPoints = participant.matching_points || 0;

        // Get all badges ordered by priority ASC
        const badges = await this.badgeRepository.find({ order: { priority: 'ASC' } });

        let targetBadge: ParticipantBadge = null;

        // Find the highest priority badge the user qualifies for
        for (const badge of badges) {
            if (currentPoints >= badge.minPoints) {
                targetBadge = badge;
            }
        }

        // If no target badge found (e.g. points < lowest badge), or target is same/lower priority than current, do nothing
        if (!targetBadge) return;

        const currentBadgePriority = participant.currentBadge ? participant.currentBadge.priority : 0;

        if (targetBadge.priority > currentBadgePriority) {
            await this.promoteParticipant(participant, targetBadge);
        }
    }

    private async promoteParticipant(participant: Participant, newBadge: ParticipantBadge) {
        this.logger.log(`Promoting participant ${participant.id} to ${newBadge.name}`);
        participant.currentBadge = newBadge;
        await this.participantRepository.save(participant);

        // Send Email
        try {
            await this.mailService.sendLevelPromotionEmail(
                participant.email,
                participant.name,
                newBadge.name,
                newBadge.benefits || []
            );
        } catch (e) {
            this.logger.error(`Failed to send promotion email to ${participant.email}`, e);
        }
    }

    async manualPromote(participantId: string, badgeId: string): Promise<void> {
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['currentBadge'] });
        if (!participant) throw new NotFoundException('Participant not found');

        const badge = await this.badgeRepository.findOne({ where: { id: badgeId } });
        if (!badge) throw new NotFoundException('Badge level not found');

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
        return this.badgeRepository.find({ order: { priority: 'ASC' } });
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
}
