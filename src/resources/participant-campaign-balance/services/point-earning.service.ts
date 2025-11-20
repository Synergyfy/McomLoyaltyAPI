import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import {
  PointHistory,
  PointHistoryType,
} from '../entities/point-history.entity';
import { DataSource } from 'typeorm';
import { ReputationService } from '../../reputation/reputation.service';
import { ReputationType } from '../../reputation/entities/reputation-type.enum';

@Injectable()
export class PointEarningService {
  constructor(
    private readonly reputationService: ReputationService,
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
  ): Promise<Participant> {
    return await this.dataSource.transaction(async (manager) => {
      const staff = await manager.findOne(Staff, {
        where: { id: staffId },
        relations: ['business'],
      });
      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
      });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const campaign = await manager.findOne(Campaign, {
        where: { id: campaignId },
      });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (
        (campaign.reward_type === 'matching' ||
          campaign.reward_type === 'both') &&
        campaign.matching_points_disabled_by_admin
      ) {
        throw new BadRequestException(
          'Matching points awards are currently disabled for this campaign.',
        );
      }

      if (
        campaign.reward_type === 'regular' ||
        campaign.reward_type === 'both'
      ) {
        if (
          campaign.regular_points_threshold !== null &&
          campaign.total_points_earned + points >
            campaign.regular_points_threshold
        ) {
          throw new BadRequestException(
            'Campaign regular points threshold reached.',
          );
        }

        let participantCampaignBalance = await manager.findOne(
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
        campaign.total_points_earned += points;
        await manager.save(participantCampaignBalance);

        const regularPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.EARN,
          points,
          participant,
          campaign,
          initiated_by_staff: staff,
          business: staff.business,
        });
        await manager.save(regularPointHistory);
      }

      if (
        campaign.reward_type === 'matching' ||
        campaign.reward_type === 'both'
      ) {
        if (
          campaign.matching_points_threshold !== null &&
          campaign.total_matching_points_earned + points >
            campaign.matching_points_threshold
        ) {
          throw new BadRequestException(
            'Campaign matching points threshold reached.',
          );
        }

        participant.matching_points += points;
        campaign.total_matching_points_earned += points;

        const matchingPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.MATCHING,
          points,
          participant,
          campaign,
          initiated_by_staff: staff,
          business: staff.business,
          description: `Matching points for campaign: ${campaign.name}`,
        });
        await manager.save(matchingPointHistory);
      }

      await manager.save(participant);
      await manager.save(campaign);

      // Trigger reputation check outside transaction to avoid blocking, or ensure it's safe
      // Since we don't have transaction propagation in checkAndUpgrade, we call it after
      // Ideally, we'd want this inside the transaction, but checkAndUpgrade uses its own connection logic
      // For simplicity and to avoid circular deps/transaction issues, we can do it after.
      // Or, we can just let it be eventual consistency.

      return participant;
    });

    // Trigger reputation check for Participant after successful transaction
    try {
      await this.reputationService.checkAndUpgrade(participantId, ReputationType.PARTICIPANT);
    } catch (e) {
      // Log error but don't fail the request? Or fail?
      // Ideally just log.
      console.error('Failed to update reputation', e);
    }

    // We might also want to update Business reputation if points are involved?
    // The requirements say Business moves up based on Points. Is it points *they* have (referral)?
    // Or points generated? "A business enters the ecosystem with 0–1000 points".
    // Assuming it's referral points, we don't update business here.

    return await this.participantRepository.findOneBy({ id: participantId });
  }
}
