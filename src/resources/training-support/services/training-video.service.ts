import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Brackets } from "typeorm";
import { TrainingVideo } from "../entities/training-video.entity";
import {
  CreateTrainingVideoDto,
  UpdateTrainingVideoDto,
  FilterTrainingVideoDto,
} from "../dto/training-video.dto";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { Tier } from "../../tier/entities/tier.entity";

@Injectable()
export class TrainingVideoService {
  constructor(
    @InjectRepository(TrainingVideo)
    private readonly trainingVideoRepository: Repository<TrainingVideo>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
  ) {}

  async create(createDto: CreateTrainingVideoDto): Promise<TrainingVideo> {
    const { target_tier_ids, ...rest } = createDto;
    const targetTiers = target_tier_ids?.length
      ? await this.tierRepository.findBy({ id: In(target_tier_ids) })
      : [];

    const video = this.trainingVideoRepository.create({
      ...rest,
      targetTiers,
    });
    return this.trainingVideoRepository.save(video);
  }

  async findAll(
    filterDto: FilterTrainingVideoDto,
  ): Promise<PaginationResult<TrainingVideo>> {
    const { page = 1, limit = 10, target_audience, title } = filterDto;
    const queryBuilder = this.trainingVideoRepository
      .createQueryBuilder("video")
      .leftJoinAndSelect("video.targetTiers", "tiers");

    if (target_audience) {
      queryBuilder.andWhere("video.target_audience = :target_audience", {
        target_audience,
      });
    }

    if (title) {
      queryBuilder.andWhere("video.title ILIKE :title", {
        title: `%${title}%`,
      });
    }

    queryBuilder.orderBy("video.created_at", "DESC");

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async findOne(id: string): Promise<TrainingVideo> {
    const video = await this.trainingVideoRepository.findOne({
      where: { id },
      relations: ["targetTiers"],
    });
    if (!video)
      throw new NotFoundException(`Training video with ID ${id} not found`);
    return video;
  }

  async update(
    id: string,
    updateDto: UpdateTrainingVideoDto,
  ): Promise<TrainingVideo> {
    const video = await this.findOne(id);
    const { target_tier_ids, ...rest } = updateDto;

    if (target_tier_ids) {
      video.targetTiers = await this.tierRepository.findBy({
        id: In(target_tier_ids),
      });
    }

    Object.assign(video, rest);
    return this.trainingVideoRepository.save(video);
  }

  async remove(id: string): Promise<void> {
    const video = await this.findOne(id);
    await this.trainingVideoRepository.remove(video);
  }
}
