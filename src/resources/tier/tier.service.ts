import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tier } from './entities/tier.entity';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { TierHistory } from './entities/tier-history.entity';
import { Admin } from '../admin/entities/admin.entity';
import { Membership } from '../membership/entities/membership.entity';
import { Role } from '../../common/role.enum';

@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(TierHistory)
    private readonly tierHistoryRepository: Repository<TierHistory>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  private async createHistory(tier: Tier, admin: Admin) {
    const history = this.tierHistoryRepository.create({
      ...tier,
      tier,
      admin,
    });
    await this.tierHistoryRepository.save(history);
  }

  async create(createTierDto: CreateTierDto, admin: Admin) {
    const tier = this.tierRepository.create(createTierDto);
    const savedTier = await this.tierRepository.save(tier);
    await this.createHistory(savedTier, admin);
    return savedTier;
  }

  async findAll() {
    return await this.tierRepository.find();
  }

  async findOne(id: string) {
    return await this.tierRepository.findOne({ where: { id } });
  }

  async update(id: string, updateTierDto: UpdateTierDto, admin: Admin) {
    await this.tierRepository.update(id, updateTierDto);
    const updatedTier = await this.findOne(id);
    await this.createHistory(updatedTier, admin);
    return updatedTier;
  }

  async remove(id: string, admin: Admin) {
    const tier = await this.findOne(id);
    await this.tierRepository.softDelete(id);
    await this.createHistory(tier, admin);
  }

  async getTierBreakdown() {
    const tiers = await this.tierRepository.find();
    const breakdown = await Promise.all(
      tiers.map(async (tier) => {
        const count = await this.membershipRepository.count({
          where: {
            tier: { id: tier.id },
            user_type: Role.Business,
          },
        });
        return {
          ...tier,
          businessCount: count,
        };
      }),
    );
    return breakdown;
  }
}
