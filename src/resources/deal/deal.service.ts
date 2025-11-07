
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal } from './entities/deal.entity';
import { Business } from '../business/entities/business.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createDealDto: CreateDealDto, business: Business): Promise<Deal> {
    if (new Date(createDealDto.endDate) <= new Date(createDealDto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const { categoryId, ...rest } = createDealDto;
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    const deal = this.dealRepository.create({
      ...rest,
      category,
      business,
    });

    return this.dealRepository.save(deal);
  }

  async findAll(
    business: Business,
    paginationDto: PaginationDto,
  ): Promise<[Deal[], number]> {
    const { page = 1, limit = 10 } = paginationDto;
    return this.dealRepository.findAndCount({
      where: { business: { id: business.id } },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string, business: Business): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, business: { id: business.id } },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    return deal;
  }

  async update(
    id: string,
    updateDealDto: UpdateDealDto,
    business: Business,
  ): Promise<Deal> {
    const deal = await this.findOne(id, business);
    Object.assign(deal, updateDealDto);
    return this.dealRepository.save(deal);
  }

  async remove(id: string, business: Business): Promise<void> {
    const deal = await this.findOne(id, business);
    await this.dealRepository.remove(deal);
  }

  async activate(id: string, business: Business): Promise<Deal> {
    const deal = await this.findOne(id, business);
    deal.isActive = true;
    return this.dealRepository.save(deal);
  }

  async deactivate(id: string, business: Business): Promise<Deal> {
    const deal = await this.findOne(id, business);
    deal.isActive = false;
    return this.dealRepository.save(deal);
  }
}
