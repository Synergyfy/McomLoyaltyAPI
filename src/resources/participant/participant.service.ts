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
import { Point } from '../point/entities/point.entity';
import { PointHistory } from '../point/entities/point-history.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
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
      let point = await this.pointRepository.findOne({
        where: {
          participant: { id: participant.id },
          campaign: { id: campaign.id },
        },
      });

      if (!point) {
        point = this.pointRepository.create({
          participant,
          campaign,
          balance: 0,
        });
      }

      point.balance += campaign.signUpPoint;
      await this.pointRepository.save(point);

      const pointHistory = this.pointHistoryRepository.create({
        participant,
        campaign,
        points: campaign.signUpPoint,
        code: 'SIGNUP',
      });

      await this.pointHistoryRepository.save(pointHistory);
    }

    return { message: 'Successfully joined campaign' };
  }
}
