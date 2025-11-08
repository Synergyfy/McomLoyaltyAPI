import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { BusinessReward } from '../../rewards/entities/business-reward.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { PointHistory, PointHistoryType } from '../entities/point-history.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async redeemReward(
    staffId: string,
    participantId: string,
    rewardId: string,
    redemptionCode: string,
  ): Promise<ParticipantCampaignBalance> {
    return await this.dataSource.transaction(async (manager) => {
      const staff = await manager.findOne(Staff, { where: { id: staffId }, relations: ['business'] });
      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      const participant = await manager.findOne(Participant, { where: { id: participantId } });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const businessReward = await manager.findOne(BusinessReward, { where: { id: rewardId }, relations: ['campaign', 'business', 'reward'] });
      if (!businessReward) {
        throw new NotFoundException('Reward not found');
      }

      if (staff.business.id !== businessReward.business.id) {
        throw new BadRequestException('Staff does not belong to the business that owns the reward');
      }

      if (businessReward.campaign.disabled) {
        throw new BadRequestException('Campaign is not active');
      }

      const participantCampaignBalance = await manager.findOne(ParticipantCampaignBalance, {
        where: { participant: { id: participantId }, campaign: { id: businessReward.campaign.id } },
      });

      if (!participantCampaignBalance) {
        throw new BadRequestException('Participant is not enrolled in this campaign');
      }

      if (participantCampaignBalance.campaign_balance < businessReward.point_required) {
        throw new BadRequestException('Not enough points');
      }

      participantCampaignBalance.campaign_balance -= businessReward.point_required;
      participant.global_total_points -= businessReward.point_required;
      businessReward.campaign.total_points_redeemed += businessReward.point_required;

      const pointHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.REDEEM,
        points: businessReward.point_required,
        participant,
        campaign: businessReward.campaign,
        reward: businessReward.reward,
        initiated_by_staff: staff,
        business: staff.business,
        redemption_code: redemptionCode,
      });

      await manager.save(participantCampaignBalance);
      await manager.save(participant);
      await manager.save(businessReward.campaign);
      await manager.save(pointHistory);

      return participantCampaignBalance;
    });
  }
}