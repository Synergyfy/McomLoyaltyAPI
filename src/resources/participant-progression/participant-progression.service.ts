import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../participant/entities/participant.entity';
import { ParticipantBadge } from './entities/participant-badge.entity';
import { CreateParticipantBadgeDto } from './dto/create-participant-badge.dto';

@Injectable()
export class ParticipantProgressionService {
    private readonly logger = new Logger(ParticipantProgressionService.name);

    constructor(
        @InjectRepository(Participant)
        private readonly participantRepository: Repository<Participant>,
        @InjectRepository(ParticipantBadge)
        private readonly badgeRepository: Repository<ParticipantBadge>,
    ) { }

    async addMatchingPoints(participantId: string, points: number): Promise<void> {
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['currentBadge'] });
        if (!participant) throw new NotFoundException('Participant not found');

        participant.matching_points = (participant.matching_points || 0) + points;
        await this.participantRepository.save(participant);

        await this.checkAndPromote(participantId);
    }

    async checkAndPromote(participantId: string): Promise<void> {
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['currentBadge'] });
        if (!participant) return;

        const totalPoints = (participant.global_total_points || 0) + (participant.matching_points || 0);
        const badges = await this.badgeRepository.find({ order: { minPoints: 'ASC' } });

        let newBadge = participant.currentBadge;

        for (const badge of badges) {
            if (totalPoints >= badge.minPoints) {
                // If not capped or within cap
                if (badge.maxPoints === null || totalPoints <= badge.maxPoints) {
                    if (!newBadge || badge.minPoints > newBadge.minPoints) {
                        newBadge = badge;
                    }
                }
            }
        }

        if (newBadge && (!participant.currentBadge || newBadge.id !== participant.currentBadge.id)) {
            this.logger.log(`Promoting participant ${participantId} to ${newBadge.name}`);
            participant.currentBadge = newBadge;
            await this.participantRepository.save(participant);
        }
    }

    async createBadge(dto: CreateParticipantBadgeDto) {
        const badge = this.badgeRepository.create(dto);
        return this.badgeRepository.save(badge);
    }

    async getBadges() {
        return this.badgeRepository.find({ order: { minPoints: 'ASC' } });
    }
}
