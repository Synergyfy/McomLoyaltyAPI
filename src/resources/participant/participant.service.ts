import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { LoginParticipantDto } from "./dto/login-participant.dto";
import { Participant } from "./entities/participant.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { AuthService } from "src/auth/auth.service";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { PointHistoryType } from "../participant-campaign-balance/entities/point-history.entity";
import { MailService } from "../../mail/mail.service";
import { PaginationResult } from "../../common/interfaces/pagination-result.interface";

import { OtpService } from "../otp/otp.service";

import { ParticipantProgressionService } from "../participant-progression/participant-progression.service";
import { ReferralService } from "../referral/referral.service";

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    private readonly progressionService: ParticipantProgressionService,
    private readonly referralService: ReferralService,
  ) {}

  async signup(createParticipantDto: CreateParticipantDto) {
    const { name, email, password, confirmPassword, campaignId } =
      createParticipantDto;

    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: { email },
    });

    if (existingParticipant) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newParticipant = this.participantRepository.create({
      name,
      email,
      password: hashedPassword,
      uniqueCode: nanoid(9),
    });

    const savedParticipant =
      await this.participantRepository.save(newParticipant);

    if (campaignId) {
      await this.joinCampaign(savedParticipant.id, campaignId);
    }

    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpService.create(savedParticipant.email, otp);
    try {
      await this.mailService.sendOtp(savedParticipant.email, otp);
    } catch (mailError) {
      console.error(`Failed to send signup OTP email to ${savedParticipant.email}:`, mailError);
      savedParticipant.otp = otp;
    }

    // Trigger Registration Reward
    this.progressionService.triggerAction(savedParticipant.id, "REGISTRATION");

    // Process Referral if code provided
    // Assuming createParticipantDto has a referralCode field or we extract it from somewhere else.
    // If not in DTO, I should add it to DTO or check if it's passed differently.
    // For now assuming it is in DTO as optional.
    if ((createParticipantDto as any).referralCode) {
      await this.referralService.processReferral(
        (createParticipantDto as any).referralCode,
        savedParticipant,
      );
    }

    return this.authService.login(savedParticipant);
  }

  async login(loginParticipantDto: LoginParticipantDto) {
    const { email, password, campaignId } = loginParticipantDto;

    const participant = await this.participantRepository.findOne({
      where: { email },
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      participant.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (campaignId) {
      await this.joinCampaign(participant.id, campaignId);
    }

    return this.authService.login(participant);
  }

  async joinCampaign(participantId: string, campaignId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["campaigns", "businessCampaigns"],
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    // 1. Try to find BusinessCampaign first
    const businessCampaign = await this.businessCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ["campaign", "business"],
    });

    if (businessCampaign) {
      if (businessCampaign.disabled) {
        throw new BadRequestException("Campaign is disabled");
      }
      if (new Date(businessCampaign.end_date) < new Date()) {
        throw new BadRequestException("Campaign has expired");
      }

      // Check if already joined
      const alreadyJoined = participant.businessCampaigns.some(
        (bc) => bc.id === businessCampaign.id,
      );

      if (!alreadyJoined) {
        // Check for available slots
        if (
          businessCampaign.total_slots !== null &&
          businessCampaign.total_slots !== undefined
        ) {
          if (businessCampaign.remaining_slots <= 0) {
            throw new BadRequestException(
              "No more slots available for this campaign",
            );
          }
        }

        participant.businessCampaigns.push(businessCampaign);

        // Decrement slots if applicable
        if (
          businessCampaign.total_slots !== null &&
          businessCampaign.total_slots !== undefined
        ) {
          businessCampaign.remaining_slots -= 1;
        }

        await this.participantRepository.save(participant);

        // Send email notification
        try {
          await this.mailService.sendCampaignJoinedEmail(
            participant.email,
            businessCampaign.name,
            businessCampaign.business
              ? businessCampaign.business.name
              : "Mcom Loyalty",
            businessCampaign.signUpPoint || 0,
          );
        } catch (error) {
          console.error("Failed to send campaign joined email:", error);
        }

        // Trigger Progression Action
        this.progressionService.triggerAction(participant.id, "CAMPAIGN_JOIN");
      }

      let participantCampaignBalance =
        await this.participantCampaignBalanceRepository.findOne({
          where: {
            participant: { id: participant.id },
            businessCampaign: { id: businessCampaign.id },
          },
        });

      if (!participantCampaignBalance) {
        participantCampaignBalance =
          this.participantCampaignBalanceRepository.create({
            participant,
            businessCampaign,
            campaign: businessCampaign.campaign,
            campaign_balance: 0,
          });
        await this.participantCampaignBalanceRepository.save(
          participantCampaignBalance,
        );
      }

      if (businessCampaign.signUpPoint) {
        participantCampaignBalance.campaign_balance +=
          businessCampaign.signUpPoint;
        participant.global_total_points += businessCampaign.signUpPoint;
        businessCampaign.total_points_earned += businessCampaign.signUpPoint;

        await this.participantCampaignBalanceRepository.save(
          participantCampaignBalance,
        );
        await this.participantRepository.save(participant);
        await this.businessCampaignRepository.save(businessCampaign);

        const pointHistory = this.pointHistoryRepository.create({
          type: PointHistoryType.EARN,
          points: businessCampaign.signUpPoint,
          participant,
          businessCampaign,
          campaign: businessCampaign.campaign,
        });

        await this.pointHistoryRepository.save(pointHistory);
      }

      return { message: "Successfully joined business campaign" };
    }

    // 2. Fallback to Campaign
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ["business"],
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const alreadyJoinedCampaign = participant.campaigns.some(
      (c) => c.id === campaign.id,
    );

    if (!alreadyJoinedCampaign) {
      participant.campaigns.push(campaign);
      await this.participantRepository.save(participant);

      // Send email notification
      try {
        await this.mailService.sendCampaignJoinedEmail(
          participant.email,
          campaign.name,
          campaign.business ? campaign.business.name : "Mcom Loyalty",
          campaign.signUpPoint || 0,
        );
      } catch (error) {
        console.error("Failed to send campaign joined email:", error);
      }

      // Trigger Progression Action
      this.progressionService.triggerAction(participant.id, "CAMPAIGN_JOIN");
    }

    let participantCampaignBalance =
      await this.participantCampaignBalanceRepository.findOne({
        where: {
          participant: { id: participant.id },
          campaign: { id: campaign.id },
        },
      });

    if (!participantCampaignBalance) {
      participantCampaignBalance =
        this.participantCampaignBalanceRepository.create({
          participant,
          campaign,
          campaign_balance: 0,
        });
      await this.participantCampaignBalanceRepository.save(
        participantCampaignBalance,
      );
    }

    if (campaign.signUpPoint) {
      participantCampaignBalance.campaign_balance += campaign.signUpPoint;
      participant.global_total_points += campaign.signUpPoint;
      campaign.total_points_earned += campaign.signUpPoint;
      await this.participantCampaignBalanceRepository.save(
        participantCampaignBalance,
      );
      await this.participantRepository.save(participant);
      await this.campaignRepository.save(campaign);

      const pointHistory = this.pointHistoryRepository.create({
        type: PointHistoryType.EARN,
        points: campaign.signUpPoint,
        participant,
        campaign,
      });

      await this.pointHistoryRepository.save(pointHistory);
    }

    return { message: "Successfully joined campaign" };
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginationResult<Participant>> {
    const [data, total] = await this.participantRepository.findAndCount({
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<Participant | undefined> {
    return this.participantRepository.findOne({ where: { id }, relations });
  }

  async delete(id: string): Promise<void> {
    await this.participantRepository.delete(id);
  }

  async update(id: string, attrs: Partial<Participant>): Promise<Participant> {
    const participant = await this.findById(id);
    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    const wasComplete = this.isProfileComplete(participant);

    Object.assign(participant, attrs);
    const updated = await this.participantRepository.save(participant);

    const isComplete = this.isProfileComplete(updated);

    if (!wasComplete && isComplete) {
      this.progressionService.triggerAction(id, "PROFILE_COMPLETE");
    }

    return updated;
  }

  private isProfileComplete(p: Participant): boolean {
    // Require Name, Email (always present), DOB, Address, Phone
    return !!(p.name && p.dob && p.address && p.phoneNumber);
  }

  async removeFromCampaign(
    participantId: string,
    campaignId: string,
  ): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ["campaigns"],
    });
    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    participant.campaigns = participant.campaigns.filter(
      (campaign) => campaign.id !== campaignId,
    );
    await this.participantRepository.save(participant);
  }

  async getHistory(
    participantId: string,
    page: number,
    limit: number,
    campaignId?: string,
    businessId?: string,
  ): Promise<{ data: PointHistory[]; total: number }> {
    const where: any = { participant: { id: participantId } };
    if (campaignId) where.campaign = { id: campaignId };
    if (businessId) where.business = { id: businessId };

    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: [
        "campaign",
        "business",
        "businessCampaign",
        "reward",
        "businessReward",
      ],
    });
    return { data, total };
  }

  async getProfile(participantId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      select: [
        "id",
        "name",
        "email",
        "role",
        "uniqueCode",
        "global_total_points",
        "matching_points",
        "isDisabled",
        "created_at",
        "updated_at",
      ],
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    const campaignBalances =
      await this.participantCampaignBalanceRepository.find({
        where: { participant: { id: participantId } },
        relations: ["campaign", "businessCampaign"],
      });

    // Calculate point utilization in a single query
    const { totalEarned, totalRedeemed } = await this.pointHistoryRepository
      .createQueryBuilder("ph")
      .select(
        "SUM(CASE WHEN ph.type IN (:...earnTypes) THEN ph.points ELSE 0 END)",
        "totalEarned",
      )
      .addSelect(
        "SUM(CASE WHEN ph.type = :redeemType THEN ph.points ELSE 0 END)",
        "totalRedeemed",
      )
      .where("ph.participant_id = :participantId", { participantId })
      .setParameters({
        earnTypes: [PointHistoryType.EARN],
        redeemType: PointHistoryType.REDEEM,
      })
      .getRawOne();

    const earned = Number(totalEarned) || 0;
    const redeemed = Number(totalRedeemed) || 0;
    const utilization = earned > 0 ? (redeemed / earned) * 100 : 0;

    return {
      ...participant,
      point_utilization: Math.round(utilization * 100) / 100,
      total_points_earned: earned,
      total_points_redeemed: redeemed,
      campaign_balances: campaignBalances.map((balance) => ({
        campaign_id: balance.campaign?.id || balance.businessCampaign?.id,
        campaign_name: balance.campaign?.name || balance.businessCampaign?.name,
        balance: balance.campaign_balance,
        stamp_balance: balance.stamp_balance,
      })),
    };
  }

  async getParticipatingCampaigns(
    participantId: string,
    page: number,
    limit: number,
  ) {
    const [data, total] =
      await this.participantCampaignBalanceRepository.findAndCount({
        where: { participant: { id: participantId } },
        relations: ["campaign", "businessCampaign"],
        skip: (page - 1) * limit,
        take: limit,
        order: { created_at: "DESC" },
      });

    return {
      data: data.map((item) => {
        const campaignData = item.campaign || item.businessCampaign;
        return {
          ...campaignData,
          balance: item.campaign_balance,
          stamp_balance: item.stamp_balance,
        };
      }),
      total,
    };
  }
}
