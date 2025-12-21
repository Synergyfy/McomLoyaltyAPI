import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubCategory } from "./entities/subcategory.entity";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubcategoryDto } from "./dto/update-subcategory.dto";
import { CategoryService } from "../category/category.service";

@Injectable()
export class SubcategoryService {
  constructor(
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
  ): Promise<SubCategory> {
    const category = await this.categoryService.findOne(
      createSubcategoryDto.categoryId,
    );
    const subCategory = this.subCategoryRepository.create({
      ...createSubcategoryDto,
      category,
    });
    return this.subCategoryRepository.save(subCategory);
  }

  findAll(): Promise<SubCategory[]> {
    return this.subCategoryRepository.find();
  }

  async findOne(id: string): Promise<SubCategory> {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
      relations: ["category"],
    });
    if (!subCategory) {
      throw new NotFoundException(`SubCategory with ID ${id} not found`);
    }
    return subCategory;
  }

  async update(
    id: string,
    updateSubcategoryDto: UpdateSubcategoryDto,
  ): Promise<SubCategory> {
    const subCategory = await this.findOne(id);
    if (updateSubcategoryDto.categoryId) {
      const category = await this.categoryService.findOne(
        updateSubcategoryDto.categoryId,
      );
      subCategory.category = category;
    }
    Object.assign(subCategory, updateSubcategoryDto);
    return this.subCategoryRepository.save(subCategory);
  }

  async remove(id: string): Promise<void> {
    const subCategory = await this.findOne(id);
    await this.subCategoryRepository.remove(subCategory);
  }
}
