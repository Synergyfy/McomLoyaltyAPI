import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ReputationLevel } from './entities/reputation-level.entity';
import { ReputationLog } from './entities/reputation-log.entity';
import { ReputationType } from './entities/reputation-type.enum';
import { Business } from '../business/entities/business.entity';
import { Participant } from '../participant/entities/participant.entity';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(ReputationLevel)
    private readonly levelRepository: Repository<ReputationLevel>,
    @InjectRepository(ReputationLog)
    private readonly logRepository: Repository<ReputationLog>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async findAllLevels(type?: ReputationType) {
    const query = this.levelRepository.createQueryBuilder('level');
    if (type) {
      query.where('level.type = :type', { type });
    }
    return query.orderBy('level.rank', 'ASC').getMany();
  }

  async getHistory(userId: string, userType: ReputationType) {
    return this.logRepository.find({
      where: { userId, userType },
      relations: ['oldLevel', 'newLevel'],
      order: { created_at: 'DESC' },
    });
  }

  async getStatus(userId: string, userType: ReputationType) {
    if (userType === ReputationType.BUSINESS) {
      const business = await this.businessRepository.findOne({
        where: { id: userId },
        relations: ['reputationLevel'],
      });
      if (!business) throw new NotFoundException('Business not found');

      let currentLevel = business.reputationLevel;

      // If no level assigned yet, try to assign the starter level or check progression
      if (!currentLevel) {
        currentLevel = await this.checkAndUpgrade(userId, userType);
      }

      const campaignCount = await this.businessRepository
        .createQueryBuilder('business')
        .leftJoin('business.campaigns', 'campaign')
        .where('business.id = :id', { id: userId })
        .select('COUNT(campaign.id)', 'count')
        .getRawOne()
        .then((res) => Number(res.count));

      return {
        currentLevel,
        points: Number(business.referralPoints || 0),
        campaignCount
      };
    } else {
      const participant = await this.participantRepository.findOne({
        where: { id: userId },
        relations: ['reputationLevel'],
      });
      if (!participant) throw new NotFoundException('Participant not found');

      let currentLevel = participant.reputationLevel;

       if (!currentLevel) {
        currentLevel = await this.checkAndUpgrade(userId, userType);
      }

      const campaignCount = await this.participantRepository
        .createQueryBuilder('participant')
        .leftJoin('participant.participantCampaignBalances', 'balance') // Assuming balance exists means joined
        .where('participant.id = :id', { id: userId })
        .select('COUNT(balance.id)', 'count')
        .getRawOne()
        .then((res) => Number(res.count));

      return {
        currentLevel,
        points: Number(participant.global_total_points || 0),
        campaignCount
      };
    }
  }

  async checkAndUpgrade(userId: string, userType: ReputationType) {
    let currentPoints = 0;
    let currentActionCount = 0;
    let currentLevel: ReputationLevel | null = null;

    if (userType === ReputationType.BUSINESS) {
      const business = await this.businessRepository.findOne({
        where: { id: userId },
        relations: ['reputationLevel', 'campaigns'],
      });
      if (!business) return;

      currentPoints = Number(business.referralPoints || 0);
      currentActionCount = await this.businessRepository
        .createQueryBuilder('business')
        .leftJoin('business.campaigns', 'campaign')
        .where('business.id = :id', { id: userId })
        .select('COUNT(campaign.id)', 'count')
        .getRawOne()
        .then((res) => Number(res.count));

      currentLevel = business.reputationLevel;
    } else {
      const participant = await this.participantRepository.findOne({
        where: { id: userId },
        relations: ['reputationLevel'],
      });
      if (!participant) return;

      currentPoints = Number(participant.global_total_points || 0);
      // Count joined campaigns
      currentActionCount = await this.participantRepository
        .createQueryBuilder('participant')
        .leftJoin('participant.participantCampaignBalances', 'balance') // Assuming balance exists means joined
        .where('participant.id = :id', { id: userId })
        .select('COUNT(balance.id)', 'count')
        .getRawOne()
        .then((res) => Number(res.count));

      currentLevel = participant.reputationLevel;
    }

    // Find appropriate level
    // Criteria: Points AND Action Count must be met for the level.
    // The prompt implies a range: "0–1000 points and up to 5 campaigns".
    // "Active: 1001–5000 points and 6–20 campaigns".
    // This suggests that to be in "Active", you need > 1000 points AND > 5 campaigns.
    // Wait, "1001-5000 points AND 6-20 campaigns".
    // What if I have 2000 points but only 2 campaigns? I should probably still be in Starter because I haven't met the campaign requirement for Active.
    // So the logic is: Find the highest level where I meet BOTH minimum requirements.

    const levels = await this.levelRepository.find({
      where: { type: userType },
      order: { rank: 'ASC' },
    });

    let bestLevel = levels[0]; // Default to lowest

    for (const level of levels) {
      if (currentPoints >= level.minPoints && currentActionCount >= level.minCampaigns) {
        bestLevel = level;
      }
    }

    // If level changed, update and log
    if (!currentLevel || bestLevel.id !== currentLevel.id) {
      if (userType === ReputationType.BUSINESS) {
        await this.businessRepository.update(userId, { reputationLevel: bestLevel });
      } else {
        await this.participantRepository.update(userId, { reputationLevel: bestLevel });
      }

      await this.logRepository.save({
        userId,
        userType,
        oldLevel: currentLevel,
        newLevel: bestLevel,
        reason: 'Automatic Upgrade/Downgrade',
      });
    }

    return bestLevel;
  }

  async manualOverride(userId: string, userType: ReputationType, levelId: string, reason: string) {
     const newLevel = await this.levelRepository.findOne({ where: { id: levelId, type: userType } });
     if (!newLevel) throw new NotFoundException('Level not found or invalid type');

     let currentLevel: ReputationLevel | null = null;

     if (userType === ReputationType.BUSINESS) {
        const business = await this.businessRepository.findOne({ where: { id: userId }, relations: ['reputationLevel'] });
        if (!business) throw new NotFoundException('Business not found');
        currentLevel = business.reputationLevel;
        await this.businessRepository.update(userId, { reputationLevel: newLevel });
     } else {
        const participant = await this.participantRepository.findOne({ where: { id: userId }, relations: ['reputationLevel'] });
        if (!participant) throw new NotFoundException('Participant not found');
        currentLevel = participant.reputationLevel;
        await this.participantRepository.update(userId, { reputationLevel: newLevel });
     }

     await this.logRepository.save({
        userId,
        userType,
        oldLevel: currentLevel,
        newLevel,
        reason: reason || 'Admin Override',
     });

     return newLevel;
  }
}
