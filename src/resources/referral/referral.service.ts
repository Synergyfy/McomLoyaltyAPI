import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Referral, ReferralStatus } from "./entities/referral.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { InviteFriendDto } from "./dto/invite-friend.dto";
import { MailService } from "../../mail/mail.service";
import { ParticipantProgressionService } from "../participant-progression/participant-progression.service";
import { ReferralAnalyticsDto } from "./dto/referral-analytics.dto";
import { Business } from "../business/entities/business.entity";
import { MatchingPointService } from "../matching-point/services/matching-point.service";
import { MatchingPointActivityType } from "../matching-point/entities/matching-point-config.entity";
import { UserType } from "../matching-point/entities/matching-point-redemption.entity";

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly mailService: MailService,
    private readonly progressionService: ParticipantProgressionService,
    private readonly matchingPointService: MatchingPointService,
  ) {}

  async inviteFriend(participantId: string, dto: InviteFriendDto) {
    const referrer = await this.participantRepository.findOne({
      where: { id: participantId },
    });
    if (!referrer) throw new NotFoundException("Referrer not found");

    let campaign = null;
    if (dto.campaignId) {
      campaign = await this.campaignRepository.findOne({
        where: { id: dto.campaignId },
      });
    }

    // Check if already referred
    const existing = await this.referralRepository.findOne({
      where: { refereeEmail: dto.email, referrer: { id: referrer.id } },
    });

    if (existing) {
      throw new BadRequestException("You have already invited this email");
    }

    // Create Referral
    const referral = this.referralRepository.create({
      referrer,
      refereeEmail: dto.email,
      campaign,
      status: ReferralStatus.PENDING,
      code: referrer.uniqueCode, // Using referrer's unique code common for all invites
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
      relations: ["referee"],
      order: { created_at: "DESC" },
    });
  }

  async processReferral(refCode: string, newParticipant: Participant) {
    // Find pending referrals for this email that used the code
    // NOTE: refCode identifies the REFERRER.
    // We find the referrer by uniqueCode provided during signup.

    const referrer = await this.participantRepository.findOne({
      where: { uniqueCode: refCode },
    });
    if (!referrer) return; // Invalid code, ignore

    // Find if there was a specific invite for this email from this referrer?
    // Or just create a successful referral record if implicit?
    // "referral system that allows participants invite their friends... record how many is successful"

    // Let's try to match an existing pending invite first
    let referral = await this.referralRepository.findOne({
      where: {
        referrer: { id: referrer.id },
        refereeEmail: newParticipant.email,
        status: ReferralStatus.PENDING,
      },
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
        code: refCode,
      });
      await this.referralRepository.save(referral);
    }

    // Trigger Reward for Referrer
    await this.progressionService.triggerAction(
      referrer.id,
      "REFERRAL_SUCCESS",
    );
  }

  async completeBusinessReferral(business: Business): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { refereeBusiness: { id: business.id } },
      relations: ["referrerBusiness"],
    });

    if (referral && referral.status === ReferralStatus.PENDING) {
      referral.status = ReferralStatus.SUCCESSFUL;
      await this.referralRepository.save(referral);

      const referrer = referral.referrerBusiness;
      if (referrer) {
        referrer.referralPoints = (Number(referrer.referralPoints) || 0) + 100;
        await this.businessRepository.save(referrer);

        // Award matching points
        const matchingPoints = await this.matchingPointService.addPoints(
          referrer.id,
          UserType.BUSINESS,
          MatchingPointActivityType.REFERRAL,
          `Referral Completed: ${business.name}`,
        );

        // Update referral with points earned
        if (matchingPoints > 0) {
          referral.pointsEarned = matchingPoints;
          await this.referralRepository.save(referral);
        }
      }
    }
  }

  async getReferralAnalytics(
    referrerId: string,
  ): Promise<ReferralAnalyticsDto> {
    // This method handles Participant referrals
    const referrals = await this.referralRepository.find({
      where: { referrer: { id: referrerId } },
      relations: ["referee"],
    });

    const totalInvites = referrals.length;
    const successfulReferrals = referrals.filter(
      (referral) => referral.status === ReferralStatus.SUCCESSFUL,
    );
    const totalSuccessfulReferrals = successfulReferrals.length;
    const totalPointsEarned = totalSuccessfulReferrals * 100;

    const referredBusinesses = referrals.map((referral) => ({
      businessId: null,
      name: referral.referee ? referral.referee.name : "Unknown",
      email: referral.referee?.email || referral.refereeEmail,
      referredAt: referral.created_at,
      status: referral.status,
      pointsEarned: 100,
      locationTag: null,
      relationshipTag: null,
    }));

    return {
      totalInvites,
      totalSuccessfulReferrals,
      totalPointsEarned,
      referredBusinesses,
      page: 1,
      limit: totalInvites || 10,
      total: totalInvites,
      totalPages: 1,
    };
  }

  async getBusinessReferralAnalytics(
    businessId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ReferralAnalyticsDto> {
    const qb = this.referralRepository
      .createQueryBuilder("referral")
      .leftJoinAndSelect("referral.refereeBusiness", "referee")
      .where("referral.referrer_business_id = :businessId", { businessId });

    if (search) {
      qb.andWhere(
        "(referee.name ILIKE :search OR referral.refereeEmail ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere("referral.status = :status", { status });
    }

    if (startDate) {
      qb.andWhere("referral.created_at >= :startDate", { startDate });
    }

    if (endDate) {
      qb.andWhere("referral.created_at <= :endDate", { endDate });
    }

    // Get Total Points separately (ignoring pagination but respecting filters? usually total points means ALL time total)
    // The requirement says "total points should be based the total matching point a business earned from referring people"
    // Usually this is a global stat, not filtered. Let's keep global stats global, and only filter the list.
    const globalStatsQb = this.referralRepository
      .createQueryBuilder("referral")
      .where("referral.referrer_business_id = :businessId", { businessId });

    const totalInvites = await globalStatsQb.getCount();
    const totalSuccessfulReferrals = await globalStatsQb
      .andWhere("referral.status = :status", {
        status: ReferralStatus.SUCCESSFUL,
      })
      .getCount();

    const { sum } = await globalStatsQb
      .select("SUM(referral.pointsEarned)", "sum")
      .getRawOne();
    const totalPointsEarned = Number(sum) || 0;

    // Apply Sorting and Pagination to the list query
    qb.orderBy("referral.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [referrals, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const referredBusinesses = referrals.map((referral) => ({
      businessId: referral.refereeBusiness?.id,
      name: referral.refereeBusiness
        ? referral.refereeBusiness.name
        : "Pending Setup",
      email: referral.refereeEmail,
      referredAt: referral.created_at,
      status: referral.status,
      pointsEarned: referral.pointsEarned || 0,
      locationTag: referral.refereeBusiness?.locationTag,
      relationshipTag: referral.refereeBusiness?.relationshipTag,
    }));

    return {
      totalInvites,
      totalSuccessfulReferrals,
      totalPointsEarned,
      referredBusinesses,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    };
  }
}
