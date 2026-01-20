import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { TrainingGuide } from "../entities/training-guide.entity";
import {
  CreateTrainingGuideDto,
  UpdateTrainingGuideDto,
  FilterTrainingGuideDto,
} from "../dto/training-guide.dto";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { Tier } from "../../tier/entities/tier.entity";
import { TrainingVideo } from "../entities/training-video.entity";
import { HelpCenterArticle } from "../entities/help-center-article.entity";

@Injectable()
export class TrainingGuideService {
  constructor(
    @InjectRepository(TrainingGuide)
    private readonly guideRepository: Repository<TrainingGuide>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(TrainingVideo)
    private readonly videoRepository: Repository<TrainingVideo>,
    @InjectRepository(HelpCenterArticle)
    private readonly articleRepository: Repository<HelpCenterArticle>,
  ) {}

  async create(createDto: CreateTrainingGuideDto): Promise<TrainingGuide> {
    const { target_tier_id, video_ids, article_ids, ...rest } = createDto;

    const targetTier = await this.tierRepository.findOne({
      where: { id: target_tier_id },
    });
    if (!targetTier)
      throw new NotFoundException(`Tier with ID ${target_tier_id} not found`);

    const videos = video_ids?.length
      ? await this.videoRepository.findBy({ id: In(video_ids) })
      : [];

    const articles = article_ids?.length
      ? await this.articleRepository.findBy({ id: In(article_ids) })
      : [];

    const guide = this.guideRepository.create({
      ...rest,
      targetTier,
      videos,
      articles,
    });
    return this.guideRepository.save(guide);
  }

  async findAll(
    filterDto: FilterTrainingGuideDto,
  ): Promise<PaginationResult<TrainingGuide>> {
    const { page = 1, limit = 10, title, target_tier_id } = filterDto;
    const queryBuilder = this.guideRepository
      .createQueryBuilder("guide")
      .leftJoinAndSelect("guide.targetTier", "tier")
      .leftJoinAndSelect("guide.videos", "videos")
      .leftJoinAndSelect("guide.articles", "articles");

    if (title) {
      queryBuilder.andWhere("guide.title ILIKE :title", {
        title: `%${title}%`,
      });
    }

    if (target_tier_id) {
      queryBuilder.andWhere("guide.target_tier_id = :target_tier_id", {
        target_tier_id,
      });
    }

    queryBuilder.orderBy("guide.created_at", "DESC");

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

  async findOne(id: string): Promise<TrainingGuide> {
    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: ["targetTier", "videos", "articles"],
    });
    if (!guide)
      throw new NotFoundException(`Training guide with ID ${id} not found`);
    return guide;
  }

  async update(
    id: string,
    updateDto: UpdateTrainingGuideDto,
  ): Promise<TrainingGuide> {
    const guide = await this.findOne(id);
    const { target_tier_id, video_ids, article_ids, ...rest } = updateDto;

    if (target_tier_id) {
      const targetTier = await this.tierRepository.findOne({
        where: { id: target_tier_id },
      });
      if (!targetTier)
        throw new NotFoundException(`Tier with ID ${target_tier_id} not found`);
      guide.targetTier = targetTier;
    }

    if (video_ids) {
      guide.videos = await this.videoRepository.findBy({ id: In(video_ids) });
    }

    if (article_ids) {
      guide.articles = await this.articleRepository.findBy({
        id: In(article_ids),
      });
    }

    Object.assign(guide, rest);
    return this.guideRepository.save(guide);
  }

  async remove(id: string): Promise<void> {
    const guide = await this.findOne(id);
    await this.guideRepository.remove(guide);
  }
}
