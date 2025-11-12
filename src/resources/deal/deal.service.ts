
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { User } from '../../common/interfaces/user.interface';
import { Role } from '../../common/role.enum';
import { DealStatus } from './enums/deal-status.enum';
import { CategoryService } from '../category/category.service';
import { FilterDealDto } from './dto/filter-deal.dto';

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(createDealDto: CreateDealDto, user: User) {
    const { categoryId, ...rest } = createDealDto;

    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const deal = this.dealRepository.create({
      ...rest,
      category,
      business: user.role === Role.Business ? { id: user.id } : null,
      status: user.role === Role.Admin ? DealStatus.APPROVED : DealStatus.PENDING,
    });

    return this.dealRepository.save(deal);
  }

  async findAll(filterDealDto: FilterDealDto, user: User) {
    const { limit, page, search, status, categoryId } = filterDealDto;
    const query = this.dealRepository.createQueryBuilder('deal');

    if (user.role === Role.Business) {
      query.where('deal.businessId = :businessId', { businessId: user.id });
    }

    if (status) {
      query.andWhere('deal.status = :status', { status });
    }

    if (categoryId) {
      query.andWhere('deal.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere('(deal.title ILIKE :search OR deal.description ILIKE :search)', { search: `%${search}%` });
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [deals, total] = await query.getManyAndCount();
    return {
      data: deals,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User) {
    const query = this.dealRepository.createQueryBuilder('deal');
    query.where('deal.id = :id', { id });

    if (user.role === Role.Business) {
      query.andWhere('deal.businessId = :businessId', { businessId: user.id });
    }

    const deal = await query.getOne();
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, user: User) {
    const { categoryId, ...rest } = updateDealDto;
    const deal = await this.findOne(id, user);

    if (categoryId) {
      const category = await this.categoryService.findOne(categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
      deal.category = category;
    }

    Object.assign(deal, rest);
    return this.dealRepository.save(deal);
  }

  async remove(id: string, user: User) {
    const deal = await this.findOne(id, user);
    await this.dealRepository.remove(deal);
    return { message: 'Deal removed successfully' };
  }

  async updateStatus(id: string, status: DealStatus) {
    const deal = await this.dealRepository.findOne({ where: { id } });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
    deal.status = status;
    return this.dealRepository.save(deal);
  }

  async deactivate(id: string, isActive: boolean, user: User) {
    const deal = await this.findOne(id, user);
    deal.isActive = isActive;
    return this.dealRepository.save(deal);
  }
}
