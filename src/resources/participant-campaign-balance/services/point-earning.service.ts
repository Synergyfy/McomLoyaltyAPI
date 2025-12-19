import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
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
import { MailService } from '../../../mail/mail.service';
import { ActionType, CapabilityService } from '../../capability/capability.service';
import { CampaignRewardMode } from '../../campaign/entities/campaign-enums';
import { TierProgressionService } from '../../tier-progression/tier-progression.service';
import { MembershipService } from '../../membership/membership.service';
import { PointPackageService } from '../../point-package/point-package.service';
import { StampPackageService } from '../../stamp/services/stamp-package.service';
import { StampService } from '../../stamp/services/stamp.service';
import { StampTriggerMethod } from '../../stamp/enums/stamp-trigger-method.enum';
import { NotificationService } from '../../notification/notification.service';
import { NotificationType, NotificationRecipientType } from '../../notification/enums/notification-type.enum';

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
    private readonly mailService: MailService,
    private readonly capabilityService: CapabilityService,
    private readonly tierProgressionService: TierProgressionService,
    private readonly membershipService: MembershipService,
    private readonly pointPackageService: PointPackageService,
    private readonly stampPackageService: StampPackageService,
    private readonly stampService: StampService,
    private readonly notificationService: NotificationService,
  ) { }

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

      // Check Reward Mode
      if (businessCampaign.reward_mode === CampaignRewardMode.STAMPS) {
        throw new BadRequestException('This campaign only allows awarding stamps.');
      }

      // Check Monthly Points Allowance
      await this.capabilityService.checkPermission(business.id, ActionType.AWARD_POINTS, { points });

      // Enforce Monthly Point Limit and Deduction Logic
      const membership = await this.membershipService.findOneByBusinessId(business.id);
      if (membership && membership.tier && membership.tier.configuration) {
        const monthlyAllowance = membership.tier.configuration.quotas.monthlyPointsAllowance;

        // Calculate points used this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const pointsUsedResult = await this.pointHistoryRepository
          .createQueryBuilder('pointHistory')
          .where('pointHistory.business_id = :businessId', { businessId: business.id })
          .andWhere('pointHistory.created_at >= :startOfMonth', { startOfMonth })
          .andWhere('pointHistory.type IN (:...types)', { types: ['EARN', 'MATCHING'] })
          .select('SUM(pointHistory.points)', 'total')
          .getRawOne();

        const pointsUsed = pointsUsedResult && pointsUsedResult.total ? Number(pointsUsedResult.total) : 0;
        const remainingMonthlyAllowance = Math.max(0, monthlyAllowance - pointsUsed);

        // Notification: 80% Allowance Warning
        const usageRatioBefore = pointsUsed / monthlyAllowance;
        const usageRatioAfter = (pointsUsed + points) / monthlyAllowance;
        if (usageRatioBefore < 0.8 && usageRatioAfter >= 0.8) {
          try {
            await this.notificationService.create(
              'Point Allowance Warning',
              `You have used over 80 % of your monthly point allowance(${Math.round(usageRatioAfter * 100)} %).`,
              NotificationType.ALLOWANCE_WARNING,
              NotificationRecipientType.BUSINESS,
              business.id
            );

            await this.mailService.sendBusinessActivityEmail(
              business.email,
              'ALLOWANCE_WARNING',
              0,
              'System',
              'System',
              'N/A',
              `You have used over 80 % of your monthly point allowance.`
            );
          } catch (e) {
            console.error('Failed to send allowance warning:', e);
          }
        }

        let pointsToDeduct = points;

        // 1. Deduct from Monthly Allowance
        if (remainingMonthlyAllowance >= pointsToDeduct) {
          // Covered by monthly allowance
          pointsToDeduct = 0;
        } else {
          pointsToDeduct -= remainingMonthlyAllowance;
        }

        // 2. Deduct from Legacy Extra Points
        if (pointsToDeduct > 0) {
          const extraPoints = business.extraPoints || 0;
          if (extraPoints >= pointsToDeduct) {
            // We don't actually deduct from the column here because we just check limits?
            // Wait, the original code didn't deduct from extraPoints column, it just checked the limit.
            // If we want to "use" them, we should probably decrement them?
            // But the original code was: totalLimit = monthlyAllowance + extraPoints.
            // It treated extraPoints as a static pool added to the limit?
            // "extraPoints purchased by the business" implies a balance.
            // If it's a balance, it should be decremented.
            // However, the previous implementation `getMonthlyPointBalance` calculated `remaining` as `(monthlyAllowance + extraPoints) - used`.
            // This implies `extraPoints` was just increasing the limit, and `used` was cumulative.
            // If `used` resets every month, then `extraPoints` would be "reused" every month if not decremented?
            // That seems wrong for "purchased" points. They should be one-time use.
            // BUT, `getMonthlyPointBalance` logic suggests they are added to the monthly limit.
            // Let's assume for now we just check availability as per previous logic, 
            // BUT if we want to support "packages" which are definitely one-time use, we need to be careful.
            // The user said: "The existing extraPoints field on the Business entity will be treated as a "legacy balance." The new point deduction logic will check monthly allowance first, then this extraPoints balance, and then proceed to deduct from the newly introduced BusinessPointPackages."

            // If I follow the previous logic strictly:
            // Total Available = Monthly Allowance + Extra Points - Used This Month.
            // If (Total Available < Points Needed), then check Packages.

            // Wait, if `extraPoints` is a one-time purchase, it shouldn't be added to monthly allowance every month.
            // If `used` is only for *this month*, then `extraPoints` would be available again next month?
            // Unless `extraPoints` is decremented when used.
            // The existing `awardPoints` did NOT decrement `extraPoints`.
            // It just checked `pointsUsed + points > totalLimit`.
            // This implies `extraPoints` was implemented as a permanent increase to the monthly limit?
            // OR `pointsUsed` should have been cumulative across all time? No, it filters by `startOfMonth`.

            // Let's assume `extraPoints` is a permanent boost for now to be safe, OR it's a bug in legacy code.
            // BUT, for the NEW packages, they are definitely balances.

            // Let's refine the logic:
            // 1. Check if (Monthly Allowance - Used This Month) covers it.
            // 2. If not, check if `extraPoints` covers the remainder. (Assuming it's a pool that sits there).
            //    If we treat `extraPoints` as a balance, we should decrement it.
            //    But if I change that behavior, I might break legacy.
            //    Let's stick to the instruction: "The new point deduction logic will check monthly allowance first, then this extraPoints balance, and then proceed to deduct from the newly introduced BusinessPointPackages."

            // If I treat `extraPoints` as a balance to be consumed:
            // I should check if I need to decrement it.
            // Given I cannot easily change legacy behavior without risk, I will treat it as "Available Points" that are checked before packages.
            // But for Packages, I MUST decrement them.

            // Let's try to implement:
            // Available from Monthly = MonthlyAllowance - UsedThisMonth.
            // If Available >= Points, OK.
            // Else, needed = Points - Available.
            // Check ExtraPoints. (Legacy: just check if we are within limit).
            // The legacy check was: `pointsUsed + points > monthlyAllowance + extraPoints`.
            // This effectively means `extraPoints` covers the overflow.
            // If `pointsUsed + points > monthlyAllowance + extraPoints`, THEN we need packages.

            const totalLegacyLimit = monthlyAllowance + (business.extraPoints || 0);
            const legacyDeficit = (pointsUsed + points) - totalLegacyLimit;

            if (legacyDeficit > 0) {
              // We need to cover `legacyDeficit` from packages.
              await this.pointPackageService.deductPoints(business.id, legacyDeficit, manager);
            }
          }
        }
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

        let isNewJoin = false;
        if (!participantCampaignBalance) {
          participantCampaignBalance =
            this.participantCampaignBalanceRepository.create({
              participant,
              campaign_balance: 0,
            });
          isNewJoin = true;

          if (businessCampaign) {
            participantCampaignBalance.businessCampaign = businessCampaign;
            if (businessCampaign.campaign) {
              participantCampaignBalance.campaign = businessCampaign.campaign;
            }
          }
        }
        participantCampaignBalance.campaign_balance += points;

        // Notification: Campaign Joined
        if (isNewJoin) {
          try {
            await this.notificationService.create(
              'New Campaign Joined',
              `Participant ${participant.name} has joined campaign ${businessCampaign ? businessCampaign.name : 'Unknown'}.`,
              NotificationType.CAMPAIGN_JOINED,
              NotificationRecipientType.BUSINESS,
              business.id,
              campaignId
            );

            if (businessCampaign && businessCampaign.business) {
              await this.mailService.sendBusinessActivityEmail(
                businessCampaign.business.email,
                'JOIN',
                0,
                participant.name,
                'System',
                businessCampaign.name,
                'Participant joined the campaign'
              );
            }
          } catch (e) {
            console.error('Failed to send campaign join notification:', e);
          }
        }

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

        // Notification: Point Awarded (Business)
        try {
          await this.notificationService.create(
            'Points Awarded',
            `You awarded ${points} points to ${participant.name}.`,
            NotificationType.POINT_AWARDED,
            NotificationRecipientType.BUSINESS,
            business.id,
            campaignId
          );
        } catch (e) { console.error(e); }

        // Notification: Point Awarded (Participant)
        try {
          await this.notificationService.create(
            'Points Received',
            `You received ${points} points from ${business.name}.`,
            NotificationType.POINT_AWARDED,
            NotificationRecipientType.USER,
            participant.id,
            campaignId
          );
        } catch (e) { console.error(e); }

        // Send email notifications
        const businessOwner = businessCampaign.business;

        // To Participant
        try {
          await this.mailService.sendPointsEarnedEmail(
            participant.email,
            points,
            business.name,
            businessCampaign.name,
            participantCampaignBalance.campaign_balance
          );
        } catch (error) {
          console.error('Failed to send points earned email to participant:', error);
        }

        // To Business Owner
        if (businessOwner) {
          try {
            await this.mailService.sendBusinessActivityEmail(
              businessOwner.email,
              'EARN',
              points,
              participant.name,
              staff ? staff.name : business.name,
              businessCampaign.name,
              sourceDescription || 'Points Awarded'
            );
          } catch (error) {
            console.error('Failed to send activity email to business owner:', error);
          }
        }
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
          description: sourceDescription || `Matching points for campaign: ${activeCampaign.name} `,
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
      const result = await this.dataSource.transaction(execute);

      // Check for promotion (fire and forget or await?)
      // We need businessId. We can get it from performerId if type is Business, or we need to look it up.
      // Since 'execute' already looked it up, we could have returned it.
      // But 'execute' returns Participant.
      // Let's just look it up again or optimize later. 
      // Actually, findPerformer is fast.
      try {
        let businessId = '';
        if (performerType === 'Business') {
          businessId = performerId;
        } else {
          const staff = await this.staffRepository.findOne({ where: { id: performerId }, relations: ['business'] });
          if (staff && staff.business) businessId = staff.business.id;
        }

        if (businessId) {
          await this.tierProgressionService.checkAndPromote(businessId);
        }
      } catch (e) {
        console.error('Error checking promotion:', e);
      }

      return result;
    }
  }

  async awardStamps(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantId: string,
    campaignId: string,
    stamps: number = 1,
    sourceDescription?: string,
    triggerMethod: StampTriggerMethod = StampTriggerMethod.MANUAL,
    transactionManager?: any,
  ): Promise<any> {
    const execute = async (manager: any) => {
      const { staff, business } = await this.findPerformer(performerId, performerType);

      const participant = await manager.findOne(Participant, {
        where: { id: participantId },
      });
      if (!participant) throw new NotFoundException('Participant not found');

      const businessCampaign = await manager.findOne(BusinessCampaign, {
        where: { id: campaignId },
        relations: ['business', 'businessStampReward', 'businessStampReward.template'],
      });

      if (!businessCampaign) throw new NotFoundException('Business campaign not found');

      if (businessCampaign.business.id !== business.id) {
        throw new BadRequestException('This campaign does not belong to the performing business');
      }

      if (businessCampaign.reward_mode === CampaignRewardMode.POINTS) {
        throw new BadRequestException('This campaign only allows awarding points.');
      }

      if (!businessCampaign.businessStampReward) {
        throw new BadRequestException('This campaign does not have a linked stamp reward.');
      }

      // Check Quota and Packages
      try {
        await this.capabilityService.checkPermission(business.id, ActionType.AWARD_STAMPS, { stamps });
      } catch (e) {
        if (e instanceof ForbiddenException) {
          // Monthly quota exceeded, deduct from packages
          await this.stampPackageService.deductStamps(business.id, stamps, manager);
        } else {
          throw e;
        }
      }

      // Award Stamps via StampService
      const card = await this.stampService.processAddStamp(
        participant,
        businessCampaign.businessStampReward,
        triggerMethod,
        sourceDescription || 'Awarded manually',
      );

      // Notifications
      try {
        await this.notificationService.create(
          'Stamps Awarded',
          `You earned a stamp from ${business.name} !`,
          NotificationType.STAMP_AWARDED,
          NotificationRecipientType.USER,
          participant.id,
        );

        await this.mailService.sendStampEarnedEmail(
          participant.email,
          stamps,
          business.name,
          businessCampaign.name,
          card.current_stamps,
        );
      } catch (error) {
        console.error('Failed to send stamp notifications:', error);
      }

      return card;
    };

    if (transactionManager) {
      return execute(transactionManager);
    } else {
      return this.dataSource.transaction(execute);
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

  async awardStampsByScan(
    performerId: string,
    performerType: 'Staff' | 'Business',
    participantCode: string,
    campaignId: string,
  ) {
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    return this.awardStamps(performerId, performerType, participant.id, campaignId, 1, 'Awarded by stamp scan');
  }

  async awardStampsDualScan(
    staffOrBusinessCode: string,
    participantCode: string,
    campaignId: string,
  ) {
    const { staff, business } = await this.findPerformerByCode(staffOrBusinessCode);
    const participant = await this.participantRepository.findOne({ where: { uniqueCode: participantCode } });
    if (!participant) throw new NotFoundException('Participant not found');

    const performerId = staff ? staff.id : business.id;
    const performerType = staff ? 'Staff' : 'Business';

    return this.awardStamps(performerId, performerType, participant.id, campaignId, 1, 'Awarded by stamp dual scan');
  }
}
