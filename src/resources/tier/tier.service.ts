import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tier } from './entities/tier.entity';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';

@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
  ) {}

  async create(createTierDto: CreateTierDto) {
    const tier = this.tierRepository.create(createTierDto);
    return await this.tierRepository.save(tier);
  }

  async findAll() {
    return await this.tierRepository.find();
  }

  async findOne(id: string) {
    return await this.tierRepository.findOne({ where: { id } });
  }

  async update(id: string, updateTierDto: UpdateTierDto) {
    await this.tierRepository.update(id, updateTierDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    await this.tierRepository.softDelete(id);
  }
}
