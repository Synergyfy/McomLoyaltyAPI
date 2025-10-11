
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from '../entities/sector.entity';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';

@Injectable()
export class SectorService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
  ) {}

  create(createSectorDto: CreateSectorDto): Promise<Sector> {
    const sector = this.sectorRepository.create(createSectorDto);
    return this.sectorRepository.save(sector);
  }

  findAll(): Promise<Sector[]> {
    return this.sectorRepository.find();
  }

  findOne(id: string): Promise<Sector> {
    return this.sectorRepository.findOne({ where: { id } });
  }

  async update(id: string, updateSectorDto: UpdateSectorDto): Promise<Sector> {
    await this.sectorRepository.update(id, updateSectorDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.sectorRepository.delete(id);
  }
}
