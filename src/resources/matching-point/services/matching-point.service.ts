import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchingPointConfig, MatchingPointActivityType } from '../entities/matching-point-config.entity';
import { MatchingPointHistory } from '../entities/matching-point-history.entity';
import { Business } from '../../business/entities/business.entity';
import { MailService } from '../../../mail/mail.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';

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
        private readonly mailService: MailService,
    ) { }

    async onModuleInit() {
        // Seed configs
        const types = Object.values(MatchingPointActivityType).filter(t => t !== MatchingPointActivityType.MANUAL_ADJUSTMENT);
        for (const type of types) {
            const exists = await this.configRepository.findOne({ where: { activity_type: type } });
            if (!exists) {
                await this.configRepository.save(this.configRepository.create({ activity_type: type, points: 0, is_active: true }));
            }
        }
    }

    async setConfig(type: MatchingPointActivityType, points: number, isActive: boolean = true) {
        let config = await this.configRepository.findOne({ where: { activity_type: type } });
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

    async addPoints(businessId: string, type: MatchingPointActivityType, description?: string) {
        const config = await this.configRepository.findOne({ where: { activity_type: type } });

        if (!config || !config.is_active || config.points <= 0) {
            return; // Config disabled or zero points
        }

        await this._processPointAddition(businessId, config.points, type, description || `Points for ${type}`);
    }

    async manualAdjustment(businessId: string, points: number, description: string) {
        await this._processPointAddition(businessId, points, MatchingPointActivityType.MANUAL_ADJUSTMENT, description);
    }

    private async _processPointAddition(businessId: string, points: number, type: MatchingPointActivityType, description: string) {
        const business = await this.businessRepository.findOne({ where: { id: businessId } });
        if (!business) {
            throw new NotFoundException(`Business with ID ${businessId} not found`);
        }

        business.matching_points = (business.matching_points || 0) + points;
        await this.businessRepository.save(business);

        const history = this.historyRepository.create({
            business,
            points,
            activity_type: type,
            description,
        });
        await this.historyRepository.save(history);

        try {
            if (points > 0) {
                await this.mailService.sendMatchingPointsReceivedEmail(business.email, points, description, business.matching_points);
            }
        } catch (e) {
            this.logger.error(`Failed to send matching points email to ${business.email}`, e.stack);
        }
    }

    async getHistory(businessId: string, paginationDto: PaginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const [data, total] = await this.historyRepository.findAndCount({
            where: { business: { id: businessId } },
            order: { created_at: 'DESC' },
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
