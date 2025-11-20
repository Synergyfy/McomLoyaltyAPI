import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReputationLevel } from '../resources/reputation/entities/reputation-level.entity';
import { ReputationType } from '../resources/reputation/entities/reputation-type.enum';

@Injectable()
export class ReputationLevelSeeder {
  constructor(
    @InjectRepository(ReputationLevel)
    private readonly reputationLevelRepository: Repository<ReputationLevel>,
  ) {}

  async seed() {
    const businessLevels = [
      {
        name: 'Starter',
        type: ReputationType.BUSINESS,
        minPoints: 0,
        maxPoints: 1000,
        minCampaigns: 0,
        maxCampaigns: 5,
        rank: 1,
        perks: ['Basic analytics', 'Standard support'],
      },
      {
        name: 'Active',
        type: ReputationType.BUSINESS,
        minPoints: 1001,
        maxPoints: 5000,
        minCampaigns: 6,
        maxCampaigns: 20,
        rank: 2,
        perks: ['Advanced analytics', 'Priority support', 'Early access'],
      },
      {
        name: 'Trusted',
        type: ReputationType.BUSINESS,
        minPoints: 5001,
        maxPoints: 10000,
        minCampaigns: 21,
        maxCampaigns: 50,
        rank: 3,
        perks: ['Dedicated account manager', 'Custom branding'],
      },
      {
        name: 'Partner',
        type: ReputationType.BUSINESS,
        minPoints: 10001,
        maxPoints: null,
        minCampaigns: 51,
        maxCampaigns: null,
        rank: 4,
        perks: ['Co-marketing opportunities', 'Exclusive beta access'],
      },
    ];

    const participantLevels = [
      {
        name: 'Bronze',
        type: ReputationType.PARTICIPANT,
        minPoints: 0,
        maxPoints: 500,
        minCampaigns: 0,
        maxCampaigns: 2,
        rank: 1,
        perks: ['Standard rewards access'],
      },
      {
        name: 'Silver',
        type: ReputationType.PARTICIPANT,
        minPoints: 501,
        maxPoints: 2000,
        minCampaigns: 3,
        maxCampaigns: 10,
        rank: 2,
        perks: ['Exclusive discounts', 'Birthday bonus'],
      },
      {
        name: 'Gold',
        type: ReputationType.PARTICIPANT,
        minPoints: 2001,
        maxPoints: 5000,
        minCampaigns: 11,
        maxCampaigns: 25,
        rank: 3,
        perks: ['Priority customer service', 'Early access to deals'],
      },
      {
        name: 'Platinum',
        type: ReputationType.PARTICIPANT,
        minPoints: 5001,
        maxPoints: null,
        minCampaigns: 26,
        maxCampaigns: null,
        rank: 4,
        perks: ['Personalized offers', 'VIP event invitations'],
      },
    ];

    const allLevels = [...businessLevels, ...participantLevels];

    for (const level of allLevels) {
      const existing = await this.reputationLevelRepository.findOne({
        where: { name: level.name, type: level.type },
      });
      if (!existing) {
        await this.reputationLevelRepository.save(level);
      }
    }
  }
}
