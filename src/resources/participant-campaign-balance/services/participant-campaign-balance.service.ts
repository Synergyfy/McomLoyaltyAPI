import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';

@Injectable()
export class ParticipantCampaignBalanceService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
  ) {}

  async getParticipantBalance(participantId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const campaignBalances = await this.participantCampaignBalanceRepository.find({
      where: { participant: { id: participantId } },
      relations: ['campaign'],
    });

    return {
      global_total_points: participant.global_total_points,
      campaign_balances: campaignBalances.map((balance) => ({
        campaign_id: balance.campaign.id,
        campaign_name: balance.campaign.name,
        balance: balance.campaign_balance,
      })),
    };
  }

  async getParticipantBalanceForCampaign(participantId: string, campaignId: string) {
    const campaignBalance = await this.participantCampaignBalanceRepository.findOne({
      where: { participant: { id: participantId }, campaign: { id: campaignId } },
      relations: ['campaign'],
    });

    if (!campaignBalance) {
      throw new NotFoundException(
        'Participant is not enrolled in this campaign or campaign does not exist.',
      );
    }

    return {
      campaign_id: campaignBalance.campaign.id,
      campaign_name: campaignBalance.campaign.name,
      balance: campaignBalance.campaign_balance,
    };
  }
}