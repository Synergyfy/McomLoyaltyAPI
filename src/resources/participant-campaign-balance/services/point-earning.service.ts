import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { PointHistory, PointHistoryType } from '../entities/point-history.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PointEarningService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async awardPoints(
    staffId: string,
    participantId: string,
    campaignId: string,
    points: number,
  ): Promise<ParticipantCampaignBalance> {
    return await this.dataSource.transaction(async (manager) => {
      let participantCampaignBalance: ParticipantCampaignBalance;
      const staff = await manager.findOne(Staff, { where: { id: staffId }, relations: ['business'] });
      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      const participant = await manager.findOne(Participant, { where: { id: participantId } });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const campaign = await manager.findOne(Campaign, { where: { id: campaignId } });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (campaign.reward_type === 'matching') {
        participant.matching_points += points;
      } else {
        participantCampaignBalance = await manager.findOne(
          ParticipantCampaignBalance,
          {
            where: {
              participant: { id: participantId },
              campaign: { id: campaignId },
            },
          },
        );

        if (!participantCampaignBalance) {
          participantCampaignBalance =
            this.participantCampaignBalanceRepository.create({
              participant,
              campaign,
              campaign_balance: 0,
            });
        }
        participantCampaignBalance.campaign_balance += points;
        participant.global_total_points += points;
        await manager.save(participantCampaignBalance);
      }

      campaign.total_points_earned += points;

      const pointHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.EARN,
        points,
        participant,
        campaign,
        initiated_by_staff: staff,
        business: staff.business,
      });

      if (campaign.reward_type !== 'matching') {
        await manager.save(participantCampaignBalance);
      }
      await manager.save(participant);
      await manager.save(campaign);
      await manager.save(pointHistory);

      return participantCampaignBalance;
    });
  }
}