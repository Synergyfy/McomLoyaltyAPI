import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tier } from './entities/tier.entity';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { TierLog, TierAction } from './entities/tier-log.entity';
import { Admin } from '../admin/entities/admin.entity';

@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(TierLog)
    private readonly tierLogRepository: Repository<TierLog>,
  ) {}

  async create(createTierDto: CreateTierDto, admin: Admin) {
    const tier = this.tierRepository.create(createTierDto);
    const savedTier = await this.tierRepository.save(tier);

    await this.tierLogRepository.save(
      this.tierLogRepository.create({
        tier: savedTier,
        admin,
        action: TierAction.CREATE,
        details: {
          after: savedTier,
        },
      }),
    );

    return savedTier;
  }

  async findAll() {
    return await this.tierRepository.find();
  }

  async findOne(id: string) {
    return await this.tierRepository.findOne({ where: { id } });
  }

  async update(id: string, updateTierDto: UpdateTierDto, admin: Admin) {
    const tierBefore = await this.findOne(id);
    await this.tierRepository.update(id, updateTierDto);
    const tierAfter = await this.findOne(id);

    await this.tierLogRepository.save(
      this.tierLogRepository.create({
        tier: tierAfter,
        admin,
        action: TierAction.UPDATE,
        details: {
          before: tierBefore,
          after: tierAfter,
        },
      }),
    );

    return tierAfter;
  }

  async remove(id: string, admin: Admin) {
    const tier = await this.findOne(id);
    await this.tierRepository.softDelete(id);

    await this.tierLogRepository.save(
      this.tierLogRepository.create({
        tier,
        admin,
        action: TierAction.DELETE,
        details: {
          before: tier,
        },
      }),
    );
  }
}
