import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";
import { PointLogFilterDto } from "../dto/point-log-filter.dto";

@Injectable()
export class PointHistoryService {
  constructor(
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
  ) {}

  async findAll(
    filterDto: PointLogFilterDto,
  ): Promise<{ data: PointHistory[]; total: number }> {
    const {
      startDate,
      endDate,
      transactionType,
      businessId,
      campaignId,
      participantId,
      page,
      limit,
    } = filterDto;

    const query: SelectQueryBuilder<PointHistory> =
      this.pointHistoryRepository.createQueryBuilder("pointHistory");

    if (startDate) {
      query.andWhere("pointHistory.created_at >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("pointHistory.created_at <= :endDate", { endDate });
    }

    if (transactionType) {
      query.andWhere("pointHistory.type = :transactionType", {
        transactionType,
      });
    }

    if (businessId) {
      query.andWhere("pointHistory.business_id = :businessId", { businessId });
    }

    if (campaignId) {
      query.andWhere("pointHistory.campaign_id = :campaignId", { campaignId });
    }

    if (participantId) {
      query.andWhere("pointHistory.participant_id = :participantId", {
        participantId,
      });
    }

    query.orderBy("pointHistory.created_at", "DESC");
    query.skip((page - 1) * limit);
    query.take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async getTotalPointsUsed(businessId: string): Promise<number> {
    const result = await this.pointHistoryRepository
      .createQueryBuilder("pointHistory")
      .select("SUM(pointHistory.points)", "total")
      .where("pointHistory.business_id = :businessId", { businessId })
      .andWhere("pointHistory.type = :type", { type: PointHistoryType.REDEEM })
      .getRawOne();

    return result && result.total ? parseInt(result.total, 10) : 0;
  }
}
