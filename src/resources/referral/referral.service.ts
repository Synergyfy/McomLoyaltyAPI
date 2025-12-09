import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { InviteFriendDto } from './dto/invite-friend.dto';
import { MailService } from '../../mail/mail.service';
import { ParticipantProgressionService } from '../participant-progression/participant-progression.service';
import { ReferralAnalyticsDto } from './dto/referral-analytics.dto';

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(Referral)
        private readonly referralRepository: Repository<Referral>,
        @InjectRepository(Participant)
        private readonly participantRepository: Repository<Participant>,
        @InjectRepository(Campaign)
        private readonly campaignRepository: Repository<Campaign>,
        private readonly mailService: MailService,
        private readonly progressionService: ParticipantProgressionService,
    ) { }

    async inviteFriend(participantId: string, dto: InviteFriendDto) {
        const referrer = await this.participantRepository.findOne({ where: { id: participantId } });
        if (!referrer) throw new NotFoundException('Referrer not found');

        let campaign = null;
        if (dto.campaignId) {
            campaign = await this.campaignRepository.findOne({ where: { id: dto.campaignId } });
        }

        // Check if already referred
        const existing = await this.referralRepository.findOne({
            where: { refereeEmail: dto.email, referrer: { id: referrer.id } }
        });

        if (existing) {
            throw new BadRequestException('You have already invited this email');
        }

        // Create Referral
        const referral = this.referralRepository.create({
            referrer,
            refereeEmail: dto.email,
            campaign,
            status: ReferralStatus.PENDING,
            code: referrer.uniqueCode // Using referrer's unique code common for all invites
        });

        await this.referralRepository.save(referral);

        // Send Email
        // await this.mailService.sendReferralInvite(dto.email, referrer.name, referral.code, campaign?.title);
        // Assuming mail service method exists or will be added. 
        // For now, logging.
        console.log(`Sending invite to ${dto.email} with code ${referral.code}`);

        return referral;
    }

    async getMyReferrals(participantId: string) {
        return this.referralRepository.find({
            where: { referrer: { id: participantId } },
            relations: ['referee'],
            order: { created_at: 'DESC' }
        });
    }

    async processReferral(refCode: string, newParticipant: Participant) {
        // Find pending referrals for this email that used the code
        // NOTE: refCode identifies the REFERRER. 
        // We find the referrer by uniqueCode provided during signup.

        const referrer = await this.participantRepository.findOne({ where: { uniqueCode: refCode } });
        if (!referrer) return; // Invalid code, ignore

        // Find if there was a specific invite for this email from this referrer?
        // Or just create a successful referral record if implicit?
        // "referral system that allows participants invite their friends... record how many is successful"

        // Let's try to match an existing pending invite first
        let referral = await this.referralRepository.findOne({
            where: {
                referrer: { id: referrer.id },
                refereeEmail: newParticipant.email,
                status: ReferralStatus.PENDING
            }
        });

        if (referral) {
            referral.status = ReferralStatus.SUCCESSFUL;
            referral.referee = newParticipant;
            await this.referralRepository.save(referral);
        } else {
            // Implicit referral (user used code but wasn't explicitly invited via email system)
            referral = this.referralRepository.create({
                referrer,
                refereeEmail: newParticipant.email,
                referee: newParticipant,
                status: ReferralStatus.SUCCESSFUL,
                code: refCode
            });
            await this.referralRepository.save(referral);
        }

        // Trigger Reward for Referrer
        await this.progressionService.triggerAction(referrer.id, 'REFERRAL_SUCCESS');
    }

    async getReferralAnalytics(referrerId: string): Promise<ReferralAnalyticsDto> {
        const referrals = await this.referralRepository.find({
            where: { referrer: { id: referrerId } },
            relations: ['referee'],
        });

        const totalInvites = referrals.length;
        const successfulReferrals = referrals.filter(
            (referral) => referral.status === ReferralStatus.SUCCESSFUL,
        );
        const totalSuccessfulReferrals = successfulReferrals.length;
        const totalPointsEarned = totalSuccessfulReferrals * 100;

        const referredBusinesses = referrals.map((referral) => ({
            name: referral.referee ? referral.referee.name : 'Unknown',
            referredAt: referral.created_at,
            status: referral.status,
        }));

        return {
            totalInvites,
            totalSuccessfulReferrals,
            totalPointsEarned,
            referredBusinesses,
        };
    }
}
