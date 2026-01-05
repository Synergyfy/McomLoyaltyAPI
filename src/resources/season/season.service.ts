import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Season } from "./entities/season.entity";
import { CreateSeasonDto } from "./dto/create-season.dto";
import { UpdateSeasonDto } from "./dto/update-season.dto";

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  async create(createSeasonDto: CreateSeasonDto): Promise<Season> {
    const season = this.seasonRepository.create(createSeasonDto);
    return await this.seasonRepository.save(season);
  }

  async findAll(): Promise<Season[]> {
    return await this.seasonRepository.find();
  }

  async findOne(id: string): Promise<Season> {
    const season = await this.seasonRepository.findOne({
      where: { id: id } as any,
    });
    if (!season) {
      throw new NotFoundException(`Season with ID "${id}" not found`);
    }
    return season;
  }

  async update(id: string, updateSeasonDto: UpdateSeasonDto): Promise<Season> {
    const season = await this.findOne(id);
    Object.assign(season, updateSeasonDto);
    return await this.seasonRepository.save(season);
  }

  async remove(id: string): Promise<void> {
    const season = await this.findOne(id);
    await this.seasonRepository.softRemove(season);
  }
}
