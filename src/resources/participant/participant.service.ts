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
import { Wallet } from './entities/wallet.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly authService: AuthService,
  ) {}

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
    });

    const savedParticipant = await this.participantRepository.save(
      newParticipant,
    );

    const wallet = this.walletRepository.create({
      participant: savedParticipant,
    });
    await this.walletRepository.save(wallet);

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
      const wallet = await this.walletRepository.findOne({
        where: { participant: { id: participantId } },
      });
      wallet.points += campaign.signUpPoint;
      await this.walletRepository.save(wallet);
    }

    return { message: 'Successfully joined campaign' };
  }
}
