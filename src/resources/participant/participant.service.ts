import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { LoginParticipantDto } from './dto/login-participant.dto';
import { Participant } from './entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { AuthService } from 'src/auth/auth.service';
import { ParticipantCampaignBalance } from '../participant-campaign-balance/entities/participant-campaign-balance.entity';
import { PointHistoryType } from '../participant-campaign-balance/entities/point-history.entity';

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
    private readonly authService: AuthService,
  ) {}

  private generateUniqueCode(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async signup(createParticipantDto: CreateParticipantDto) {
    const { name, email, password, confirmPassword, campaignId } =
      createParticipantDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: { email },
    });

    if (existingParticipant) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newParticipant = this.participantRepository.create({
      name,
      email,
      password: hashedPassword,
      uniqueCode: this.generateUniqueCode(),
    });

    const savedParticipant = await this.participantRepository.save(
      newParticipant,
    );

    if (campaignId) {
      await this.joinCampaign(savedParticipant.id, campaignId);
    }

    return this.authService.login(savedParticipant);
  }

  async login(loginParticipantDto: LoginParticipantDto) {
    const { email, password, campaignId } = loginParticipantDto;

    const participant = await this.participantRepository.findOne({
      where: { email },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      participant.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (campaignId) {
      await this.joinCampaign(participant.id, campaignId);
    }

    return this.authService.login(participant);
  }

  async joinCampaign(participantId: string, campaignId: string) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['campaigns'],
    });
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!participant || !campaign) {
      throw new NotFoundException('Participant or Campaign not found');
    }

    if (campaign.end_date < new Date()) {
      throw new BadRequestException('Campaign has expired');
    }

    participant.campaigns.push(campaign);
    await this.participantRepository.save(participant);

    if (campaign.signUpPoint) {
      let participantCampaignBalance = await this.participantCampaignBalanceRepository.findOne({
        where: {
          participant: { id: participant.id },
          campaign: { id: campaign.id },
        },
      });

      if (!participantCampaignBalance) {
        participantCampaignBalance = this.participantCampaignBalanceRepository.create({
          participant,
          campaign,
          campaign_balance: 0,
        });
      }

      participantCampaignBalance.campaign_balance += campaign.signUpPoint;
      participant.global_total_points += campaign.signUpPoint;
      campaign.total_points_earned += campaign.signUpPoint;
      await this.participantCampaignBalanceRepository.save(participantCampaignBalance);
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

    return { message: 'Successfully joined campaign' };
  }

  async findAll(page: number, limit: number): Promise<{ data: Participant[], total: number }> {
    const [data, total] = await this.participantRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findById(id: string, relations: string[] = []): Promise<Participant | undefined> {
    return this.participantRepository.findOne({ where: { id }, relations });
  }

  async delete(id: string): Promise<void> {
    await this.participantRepository.delete(id);
  }

  async update(id: string, attrs: Partial<Participant>): Promise<Participant> {
    const participant = await this.findById(id);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    Object.assign(participant, attrs);
    return this.participantRepository.save(participant);
  }

  async removeFromCampaign(participantId: string, campaignId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['campaigns'],
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
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
  ): Promise<{ data: PointHistory[]; total: number }> {
    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where: { participant: { id: participantId } },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}