import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { PointHistory, PointHistoryType } from '../entities/point-history.entity';
import { AwardMatchingPointsDto } from '../../admin/dto/award-matching-points.dto';

@Injectable()
export class MatchingPointsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
  ) {}

  async award(
    awardMatchingPointsDto: AwardMatchingPointsDto,
  ): Promise<Participant> {
    const { email, points, description } = awardMatchingPointsDto;

    const participant = await this.participantRepository.findOne({
      where: { email },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with email ${email} not found`);
    }

    participant.matching_points += points;

    const pointHistory = this.pointHistoryRepository.create({
      participant,
      points,
      type: PointHistoryType.MATCHING,
      description,
    });

    await this.pointHistoryRepository.save(pointHistory);
    return await this.participantRepository.save(participant);
  }
}
