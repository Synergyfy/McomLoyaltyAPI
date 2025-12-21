import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sector } from "../entities/sector.entity";
import { CreateSectorDto } from "../dto/create-sector.dto";
import { UpdateSectorDto } from "../dto/update-sector.dto";
import { Category } from "src/resources/category/entities/category.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class SectorService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createSectorDto: CreateSectorDto): Promise<Sector> {
    const existingSector = await this.sectorRepository.findOne({
      where: { name: createSectorDto.name },
    });
    if (existingSector) {
      throw new NotFoundException(
        `Sector with name ${createSectorDto.name} already exists`,
      );
    }
    const sector = this.sectorRepository.create(createSectorDto);
    return this.sectorRepository.save(sector);
  }

  findAll(): Promise<Sector[]> {
    return this.sectorRepository.find();
  }

  async findOne(id: string): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({
      where: { id },
      relations: ["categories"],
    });
    if (!sector) {
      throw new NotFoundException(`Sector with ID ${id} not found`);
    }
    return sector;
  }

  async update(id: string, updateSectorDto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id);
    Object.assign(sector, updateSectorDto);
    return this.sectorRepository.save(sector);
  }

  async remove(id: string): Promise<void> {
    const sector = await this.findOne(id);
    await this.sectorRepository.remove(sector);
  }

  async getCategoriesBySector(sectorId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const [categories, total] = await this.categoryRepository.findAndCount({
      where: { sector: { id: sectorId } },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: categories,
      total,
      page,
      limit,
      nextPage: total > page * limit ? page + 1 : null,
    };
  }
}
