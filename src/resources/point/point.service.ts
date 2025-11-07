import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from './entities/point.entity';
import { PointHistory } from './entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Staff } from '../staff/entities/staff.entity';
import { AwardPointDto } from './dto/award-point.dto';
import { PointLogDto } from './dto/point-log.dto';
import { User } from '../../common/interfaces/user.interface';
import { Role } from '../../common/role.enum';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async awardPoint(awardPointDto: AwardPointDto, currentUser: User) {
    const { code, points, campaignId } = awardPointDto;

    const participant = await this.participantRepository.findOne({ where: { uniqueCode: code } });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId }, relations: ['business'] });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (currentUser.role === Role.Business) {
      if (campaign.business.id !== currentUser.id) {
        throw new UnauthorizedException('You are not authorized to award points for this campaign');
      }
    } else if (currentUser.role === Role.Staff) {
      const staff = await this.staffRepository.findOne({ where: { id: currentUser.id }, relations: ['business'] });
      if (staff.business.id !== campaign.business.id) {
        throw new UnauthorizedException('You are not authorized to award points for this campaign');
      }
    }

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

    point.balance += points;
    await this.pointRepository.save(point);

    const pointHistory = this.pointHistoryRepository.create({
      participant,
      campaign,
      points,
      code,
      awardedByBusiness: currentUser.role === Role.Business ? { id: currentUser.id } as Business : null,
      awardedByStaff: currentUser.role === Role.Staff ? { id: currentUser.id } as Staff : null,
    });

    await this.pointHistoryRepository.save(pointHistory);

    return point;
  }

  async getParticipantBalance(participantId: string, campaignId?: string) {
    const query = this.pointRepository.createQueryBuilder('point')
      .where('point.participant.id = :participantId', { participantId });

    if (campaignId) {
      query.andWhere('point.campaign.id = :campaignId', { campaignId });
      const result = await query.getOne();
      return result ? result.balance : 0;
    }

    const results = await query.getMany();
    return results.reduce((acc, point) => acc + point.balance, 0);
  }

  async getParticipantHistory(participantId: string, campaignId?: string) {
    const query = this.pointHistoryRepository.createQueryBuilder('pointHistory')
      .where('pointHistory.participant.id = :participantId', { participantId });

    if (campaignId) {
      query.andWhere('pointHistory.campaign.id = :campaignId', { campaignId });
    }

    return query.getMany();
  }

  async getPointLogs(currentUser: User, pointLogDto: PointLogDto) {
    const { campaignId } = pointLogDto;

    const query = this.pointHistoryRepository.createQueryBuilder('pointHistory')
      .leftJoinAndSelect('pointHistory.participant', 'participant')
      .leftJoinAndSelect('pointHistory.campaign', 'campaign')
      .leftJoinAndSelect('pointHistory.awardedByBusiness', 'awardedByBusiness')
      .leftJoinAndSelect('pointHistory.awardedByStaff', 'awardedByStaff')
      .where('campaign.business.id = :businessId', { businessId: currentUser.id });

    if (campaignId) {
      query.andWhere('campaign.id = :campaignId', { campaignId });
    }

    return query.getMany();
  }
}
