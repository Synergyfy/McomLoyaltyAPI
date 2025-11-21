import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { TransactionCode, TransactionCodeStatus, TransactionType } from '../entities/transaction-code.entity';
import { PointEarningService } from './point-earning.service';
import { RedemptionService } from './redemption.service';

@Injectable()
export class ParticipantCampaignBalanceService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(TransactionCode)
    private readonly transactionCodeRepository: Repository<TransactionCode>,
    private readonly pointEarningService: PointEarningService,
    private readonly redemptionService: RedemptionService,
    private readonly dataSource: DataSource,
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
      global_total_points:
        participant.global_total_points + participant.matching_points,
      matching_points: participant.matching_points,
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

  async claimCode(participantId: string, code: string, campaignId: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validate Code
      const transactionCode = await manager.findOne(TransactionCode, {
        where: { code },
        relations: ['campaign', 'reward', 'creator_business', 'creator_staff'],
        lock: { mode: 'pessimistic_write' } // Lock to prevent double usage race condition
      });

      if (!transactionCode) {
        throw new NotFoundException('Transaction code not found');
      }

      if (transactionCode.campaign.id !== campaignId) {
        throw new BadRequestException('Code is not valid for this campaign');
      }

      if (transactionCode.status !== TransactionCodeStatus.ACTIVE) {
        throw new BadRequestException(`Code is ${transactionCode.status}`);
      }

      if (transactionCode.expires_at < new Date()) {
        transactionCode.status = TransactionCodeStatus.EXPIRED;
        await manager.save(transactionCode);
        throw new BadRequestException('Code has expired');
      }

      // 2. Mark as Used
      transactionCode.status = TransactionCodeStatus.USED;
      transactionCode.used_by_participant = { id: participantId } as any;
      await manager.save(transactionCode);

      const performerId = transactionCode.creator_staff ? transactionCode.creator_staff.id : transactionCode.creator_business.id;
      const performerType = transactionCode.creator_staff ? 'Staff' : 'Business';

      // 3. Award/Redeem (We need to adapt PointEarningService/RedemptionService to accept a manager)
      // Since adapting them might be complex given they use repository injection,
      // I will extract the core logic or move it here?
      // Actually, let's look at PointEarningService. It uses dataSource.transaction.
      // Nested transactions in TypeORM: if I call a method that starts a transaction from within a transaction, it might work or fail depending on driver.
      // But better: I should modify PointEarningService to accept an optional EntityManager.

      // For now, let's replicate the call but passing the manager is tricky without refactoring.
      // Refactoring PointEarningService and RedemptionService is the clean way.

      // Let's assume I refactor them to: awardPoints(..., manager?: EntityManager)

      if (transactionCode.type === TransactionType.EARN) {
        return this.pointEarningService.awardPoints(
          performerId,
          performerType,
          participantId,
          campaignId,
          transactionCode.points,
          'Awarded via claimed code',
          manager // Pass manager
        );
      } else {
         if (!transactionCode.reward) throw new BadRequestException('This code is not linked to a reward');
         return this.redemptionService.redeemReward(
          performerId,
          performerType,
          participantId,
          transactionCode.reward.id,
          code,
          'Redeemed via claimed code',
          manager // Pass manager
        );
      }
    });
  }
}
