
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistAggregate } from './entities/wishlist-aggregate.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class WishlistAggregationService {
  private readonly logger = new Logger(WishlistAggregationService.name);

  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(WishlistAggregate)
    private readonly wishlistAggregateRepository: Repository<WishlistAggregate>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Starting wishlist aggregation');
    await this.aggregateWishlistItems();
    this.logger.debug('Finished wishlist aggregation');
  }

  async aggregateWishlistItems() {
    const aggregatedWishes = await this.wishlistItemRepository
      .createQueryBuilder('item')
      .select('item.itemName', 'itemName')
      .addSelect('item.categoryId', 'categoryId')
      .addSelect('COUNT(item.id)', 'audienceSize')
      .addSelect('ARRAY_AGG(item.targetDate)', 'targetDates')
      .where('item.marketingConsent = :consent', { consent: true })
      .groupBy('item.itemName, item.categoryId')
      .getRawMany();

    for (const wish of aggregatedWishes) {
      let aggregate = await this.wishlistAggregateRepository.findOne({
        where: {
          itemName: wish.itemName,
          category: { id: wish.categoryId },
        },
      });

      if (aggregate) {
        aggregate.audienceSize = parseInt(wish.audienceSize, 10);
        aggregate.targetDates = wish.targetDates;
      } else {
        aggregate = this.wishlistAggregateRepository.create({
          itemName: wish.itemName,
          category: { id: wish.categoryId } as Category,
          audienceSize: parseInt(wish.audienceSize, 10),
          targetDates: wish.targetDates,
        });
      }

      await this.wishlistAggregateRepository.save(aggregate);
    }
  }
}
