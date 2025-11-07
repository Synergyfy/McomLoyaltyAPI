import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
import { ParticipantQueryDto } from './dto/participant-query.dto';
import { ParticipantDetailQueryDto } from './dto/participant-detail-query.dto';

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

  private async _generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.random().toString().slice(2, 11);
      const existingCode = await this.pointHistoryRepository.findOne({ where: { code } });
      if (!existingCode) {
        isUnique = true;
      }
    }
    return code;
  }

  async getParticipantCode(currentUser: User) {
    const participant = await this.participantRepository.findOne({ where: { id: currentUser.id } });
    if (!participant.uniqueCode) {
      participant.uniqueCode = await this._generateUniqueCode();
      await this.participantRepository.save(participant);
    }
    return participant.uniqueCode;
  }

  async generateBusinessCode() {
    return this._generateUniqueCode();
  }

  async awardPoint(awardPointDto: AwardPointDto, currentUser: User) {
    const { code, points, campaignId } = awardPointDto;

    let participant = await this.participantRepository.findOne({ where: { uniqueCode: code } });
    if (!participant) {
      const pointHistory = await this.pointHistoryRepository.findOne({ where: { code }, relations: ['participant'] });
      if (!pointHistory) {
        throw new NotFoundException('Code not found');
      }
      participant = pointHistory.participant;
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
      .where('point.participantId = :participantId', { participantId });

    if (campaignId) {
      query.andWhere('point.campaignId = :campaignId', { campaignId });
      const result = await query.getOne();
      return result ? result.balance : 0;
    }

    const results = await query.getMany();
    return results.reduce((acc, point) => acc + point.balance, 0);
  }

  async getParticipantHistory(participantId: string, campaignId?: string) {
    const query = this.pointHistoryRepository.createQueryBuilder('pointHistory')
      .where('pointHistory.participantId = :participantId', { participantId });

    if (campaignId) {
      query.andWhere('pointHistory.campaignId = :campaignId', { campaignId });
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
      .where('campaign.businessId = :businessId', { businessId: currentUser.id });

    if (campaignId) {
      query.andWhere('campaign.id = :campaignId', { campaignId });
    }

    return query.getMany();
  }

  async getBusinessParticipants(
    currentUser: User,
    query: ParticipantQueryDto,
  ) {
    const { campaignId, page = 1, limit = 10 } = query;
    const businessId = currentUser.id;

    const qb = this.participantRepository
      .createQueryBuilder('p')
      .leftJoin('p.campaigns', 'c')
      .where('c.business_id = :businessId', { businessId })
      .select('p')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('SUM(points.balance)', 'totalPoints')
            .from(Point, 'points')
            .where('points.participantId = p.id'),
        'totalPoints',
      )
      .groupBy('p.id');

    if (campaignId) {
      qb.andWhere('c.id = :campaignId', { campaignId });
    }

    const [participants, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: participants,
      total,
      page,
      limit,
    };
  }

  async getParticipantDetails(
    participantId: string,
    query: ParticipantDetailQueryDto,
  ) {
    const { campaignId } = query;

    const balance = await this.getParticipantBalance(participantId, campaignId);
    const history = await this.getParticipantHistory(participantId, campaignId);

    return {
      balance,
      history,
    };
  }
}
