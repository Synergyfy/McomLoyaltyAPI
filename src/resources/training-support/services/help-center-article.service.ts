import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { HelpCenterArticle } from "../entities/help-center-article.entity";
import {
  CreateHelpCenterArticleDto,
  UpdateHelpCenterArticleDto,
  FilterHelpCenterArticleDto,
} from "../dto/help-center-article.dto";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { Tier } from "../../tier/entities/tier.entity";

@Injectable()
export class HelpCenterArticleService {
  constructor(
    @InjectRepository(HelpCenterArticle)
    private readonly articleRepository: Repository<HelpCenterArticle>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
  ) {}

  async create(
    createDto: CreateHelpCenterArticleDto,
  ): Promise<HelpCenterArticle> {
    const { target_tier_ids, ...rest } = createDto;
    const targetTiers = target_tier_ids?.length
      ? await this.tierRepository.findBy({ id: In(target_tier_ids) })
      : [];

    const article = this.articleRepository.create({
      ...rest,
      targetTiers,
    });
    return this.articleRepository.save(article);
  }

  async findAll(
    filterDto: FilterHelpCenterArticleDto,
  ): Promise<PaginationResult<HelpCenterArticle>> {
    const {
      page = 1,
      limit = 10,
      target_audience,
      title,
      category,
    } = filterDto;
    const queryBuilder = this.articleRepository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.targetTiers", "tiers");

    if (target_audience) {
      queryBuilder.andWhere("article.target_audience = :target_audience", {
        target_audience,
      });
    }

    if (title) {
      queryBuilder.andWhere("article.title ILIKE :title", {
        title: `%${title}%`,
      });
    }

    if (category) {
      queryBuilder.andWhere("article.category = :category", { category });
    }

    queryBuilder.orderBy("article.created_at", "DESC");

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

  async findOne(id: string): Promise<HelpCenterArticle> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ["targetTiers"],
    });
    if (!article)
      throw new NotFoundException(`Article with ID ${id} not found`);
    return article;
  }

  async update(
    id: string,
    updateDto: UpdateHelpCenterArticleDto,
  ): Promise<HelpCenterArticle> {
    const article = await this.findOne(id);
    const { target_tier_ids, ...rest } = updateDto;

    if (target_tier_ids) {
      article.targetTiers = await this.tierRepository.findBy({
        id: In(target_tier_ids),
      });
    }

    Object.assign(article, rest);
    return this.articleRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
  }
}
