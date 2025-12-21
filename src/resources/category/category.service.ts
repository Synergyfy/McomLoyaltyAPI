import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./entities/category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { SectorService } from "../sector/services/sector.service";
import { SubCategory } from "../subcategory/entities/subcategory.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly sectorService: SectorService,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const sector = await this.sectorService.findOne(createCategoryDto.sectorId);
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      sector,
    });
    return this.categoryRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ["subCategories", "sector"],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    if (updateCategoryDto.sectorId) {
      const sector = await this.sectorService.findOne(
        updateCategoryDto.sectorId,
      );
      category.sector = sector;
    }
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async getSubCategoriesByCategory(
    categoryId: string,
    paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const [subCategories, total] =
      await this.subCategoryRepository.findAndCount({
        where: { category: { id: categoryId } },
        take: limit,
        skip: (page - 1) * limit,
      });

    return {
      data: subCategories,
      total,
      page,
      limit,
      nextPage: total > page * limit ? page + 1 : null,
    };
  }
}
