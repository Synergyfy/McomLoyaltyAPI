import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Business } from '../../business/entities/business.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { BusinessReward } from '../../rewards/entities/business-reward.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';
import { Reward } from '../../rewards/entities/reward.entity';
import { PointHistory, PointHistoryType } from '../entities/point-history.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
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

  // Helper to find performer (Staff or Business)
  private async findPerformer(id: string, type: 'Staff' | 'Business') {
    if (type === 'Staff') {
      const staff = await this.staffRepository.findOne({ where: { id }, relations: ['business'] });
      if (!staff) throw new NotFoundException('Staff not found');
      return { staff, business: staff.business };
    } else {
      const business = await this.businessRepository.findOne({ where: { id } });
      if (!business) throw new NotFoundException('Business not found');
      return { staff: null, business };
    }
  }

  // Helper to find performer by unique code
  private async findPerformerByCode(code: string) {
    const staff = await this.staffRepository.findOne({ where: { uniqueCode: code }, relations: ['business'] });
    if (staff) return { staff, business: staff.business };

    const business = await this.businessRepository.findOne({ where: { uniqueCode: code } });
    if (business) return { staff: null, business };

    throw new NotFoundException('Invalid staff or business code');
  }

  async redeemReward(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantId: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null,
    sourceDescription?: string,
    transactionManager?: any, // EntityManager
  ): Promise<ParticipantCampaignBalance> {
    const execute = async (manager: any) => {
      const { staff, business } = await this.findPerformer(performerId, performerType);

      const participant = await manager.findOne(Participant, { where: { id: participantId } });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const reward = await manager.findOne(Reward, { where: { id: rewardId } });
      if (!reward) {
        throw new NotFoundException('Reward not found');
      }

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ['business', 'rewards', 'campaign'],
      });

      if (!businessCampaign) {
        throw new NotFoundException('Business campaign not found');
      }

      if (!businessCampaign.business || business.id !== businessCampaign.business.id) {
        throw new BadRequestException('This campaign does not belong to the performing business');
      }

      if (businessCampaign.disabled) {
        throw new BadRequestException('Campaign is not active');
      }

      const isRewardInCampaign = businessCampaign.rewards.some((r) => r.id === reward.id);
      if (!isRewardInCampaign) {
        throw new BadRequestException('Reward is not available in this campaign');
      }

      const whereCondition: any = {
          participant: { id: participantId },
          businessCampaign: { id: campaignId },
        };

      const participantCampaignBalance = await manager.findOne(ParticipantCampaignBalance, {
        where: whereCondition,
      });

      if (!participantCampaignBalance) {
        throw new BadRequestException('Participant is not enrolled in this campaign');
      }

      if (participantCampaignBalance.campaign_balance < reward.points_required) {
        throw new BadRequestException('Not enough points');
      }

      participantCampaignBalance.campaign_balance -= reward.points_required;
      participant.global_total_points -= reward.points_required;
      businessCampaign.total_points_redeemed += reward.points_required;

      const pointHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.REDEEM,
        points: reward.points_required,
        participant,
        reward: reward,
        initiated_by_staff: staff,
        business: business,
        redemption_code: redemptionCode,
        description: sourceDescription,
      });

      // Try to find BusinessReward to link
      const businessReward = await manager.findOne(BusinessReward, {
        where: {
          reward: { id: reward.id },
          business: { id: business.id },
        },
      });

      if (businessReward) {
        pointHistory.businessReward = businessReward;
      }

      pointHistory.businessCampaign = businessCampaign;
      if (businessCampaign.campaign) {
          pointHistory.campaign = businessCampaign.campaign;
      }

      await manager.save(participantCampaignBalance);
      await manager.save(participant);
      await manager.save(BusinessCampaign, businessCampaign);
      await manager.save(pointHistory);

      return participantCampaignBalance;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return await this.dataSource.transaction(execute);
    }
  }

   // Method A: Staff/Business scans Participant to Redeem
   async redeemRewardByScan(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantCode: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null
  ) {
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    return this.redeemReward(performerId, performerType, participant.id, rewardId, campaignId, redemptionCode, 'Redeemed by scan');
  }

  // Method C: Dual Code Redemption
  async redeemRewardDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    rewardId: string,
    campaignId: string,
    redemptionCode: string | null
  ) {
    const { staff, business } = await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? 'Staff' : 'Business';

    return this.redeemReward(performerId, performerType, participant.id, rewardId, campaignId, redemptionCode, 'Redeemed by dual scan');
  }
}
