
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistAggregate } from './entities/wishlist-aggregate.entity';
import { Category } from '../category/entities/category.entity';
import { Participant } from '../participant/entities/participant.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(WishlistAggregate)
    private readonly wishlistAggregateRepository: Repository<WishlistAggregate>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    participant: Participant,
  ): Promise<WishlistItem> {
    const { categoryId, ...rest } = createWishlistDto;
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const wishlistItem = this.wishlistItemRepository.create({
      ...rest,
      category,
      participant,
    });

    return this.wishlistItemRepository.save(wishlistItem);
  }

  async getWishlistInsights(): Promise<WishlistAggregate[]> {
    return this.wishlistAggregateRepository.find();
  }
}
