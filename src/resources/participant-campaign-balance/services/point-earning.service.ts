import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Business } from '../../business/entities/business.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';
import {
  PointHistory,
  PointHistoryType,
} from '../entities/point-history.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PointEarningService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
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

  async awardPoints(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantId: string,
    campaignId: string,
    points: number,
    sourceDescription?: string,
    transactionManager?: any, // EntityManager
  ): Promise<Participant> {
    const execute = async (manager: any) => {
      const { staff, business } = await this.findPerformer(performerId, performerType);

      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
      });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ['business', 'campaign'],
      });

      if (!businessCampaign) {
        throw new NotFoundException('Business campaign not found');
      }

      const activeCampaign = businessCampaign;

      // Check if business matches
      if (businessCampaign && businessCampaign.business.id !== business.id) {
         throw new BadRequestException('This campaign does not belong to the performing business');
      }
       // If it's a regular Campaign (admin template), business might not be directly linked or null, but typically we award on claimed ones (BC)

      if (
        (activeCampaign.reward_type === 'matching' ||
          activeCampaign.reward_type === 'both') &&
        activeCampaign.matching_points_disabled_by_admin
      ) {
        throw new BadRequestException(
          'Matching points awards are currently disabled for this campaign.',
        );
      }

      if (
        activeCampaign.reward_type === 'regular' ||
        activeCampaign.reward_type === 'both'
      ) {
        if (
          activeCampaign.regular_points_threshold !== null &&
          activeCampaign.total_points_earned + points >
            activeCampaign.regular_points_threshold
        ) {
          throw new BadRequestException(
            'Campaign regular points threshold reached.',
          );
        }

        const whereCondition: any = { participant: { id: participantId } };
        if (businessCampaign) {
            whereCondition.businessCampaign = { id: campaignId };
        }

        let participantCampaignBalance = await manager.findOne(
          ParticipantCampaignBalance,
          {
            where: whereCondition,
          },
        );

        if (!participantCampaignBalance) {
          participantCampaignBalance =
            this.participantCampaignBalanceRepository.create({
              participant,
              campaign_balance: 0,
            });

           if (businessCampaign) {
               participantCampaignBalance.businessCampaign = businessCampaign;
               if (businessCampaign.campaign) {
                    participantCampaignBalance.campaign = businessCampaign.campaign;
               }
           }
        }
        participantCampaignBalance.campaign_balance += points;
        participant.global_total_points += points;
        activeCampaign.total_points_earned += points;
        
        // Update business totals
        if (businessCampaign.business) {
            businessCampaign.business.total_points_earned += points;
            await manager.save(businessCampaign.business);
        }

        await manager.save(participantCampaignBalance);

        const regularPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.EARN,
          points,
          participant,
          initiated_by_staff: staff,
          business: business,
          description: sourceDescription,
        });

        if (businessCampaign) {
            regularPointHistory.businessCampaign = businessCampaign;
            if (businessCampaign.campaign) {
                 regularPointHistory.campaign = businessCampaign.campaign;
            }
        }

        await manager.save(regularPointHistory);
      }

      if (
        activeCampaign.reward_type === 'matching' ||
        activeCampaign.reward_type === 'both'
      ) {
        if (
          activeCampaign.matching_points_threshold !== null &&
          activeCampaign.total_matching_points_earned + points >
            activeCampaign.matching_points_threshold
        ) {
          throw new BadRequestException(
            'Campaign matching points threshold reached.',
          );
        }

        participant.matching_points += points;
        activeCampaign.total_matching_points_earned += points;

        const matchingPointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.MATCHING,
          points,
          participant,
          initiated_by_staff: staff,
          business: business,
          description: sourceDescription || `Matching points for campaign: ${activeCampaign.name}`,
        });

        if (businessCampaign) {
            matchingPointHistory.businessCampaign = businessCampaign;
            if (businessCampaign.campaign) {
                 matchingPointHistory.campaign = businessCampaign.campaign;
            }
        }

        await manager.save(matchingPointHistory);
      }

      await manager.save(participant);
      if (businessCampaign) {
          await manager.save(BusinessCampaign, businessCampaign);
      }

      return participant;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return await this.dataSource.transaction(execute);
    }
  }

  // Method A: Staff/Business scans Participant
  async awardPointsByScan(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantCode: string,
    campaignId: string,
    points: number
  ) {
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    return this.awardPoints(performerId, performerType, participant.id, campaignId, points, 'Awarded by scan');
  }

  // Method C: Dual Code
  async awardPointsDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    campaignId: string,
    points: number
  ) {
    const { staff, business } = await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? 'Staff' : 'Business';

    return this.awardPoints(performerId, performerType, participant.id, campaignId, points, 'Awarded by dual scan');
  }
}
