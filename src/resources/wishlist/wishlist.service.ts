
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    participant: Participant,
  ): Promise<WishlistItem> {
    const { categoryId, ...rest } = createWishlistDto;

    // Normalize the item name for consistent aggregation
    const normalizedItemName = createWishlistDto.itemName.trim().toLowerCase();

    return this.dataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);
      const wishlistItemRepository = manager.getRepository(WishlistItem);

      const category = await categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      const wishlistItem = wishlistItemRepository.create({
        ...rest,
        itemName: normalizedItemName, // Use the normalized name
        category,
        participant,
      });

      const savedItem = await wishlistItemRepository.save(wishlistItem);

      // Only update the aggregate if the user has consented to marketing
      if (createWishlistDto.marketingConsent) {
        // Use a highly efficient and concurrency-safe UPSERT operation
        const upsertQuery = `
          INSERT INTO wishlist_aggregates ("itemName", "categoryId", "audienceSize", "targetDates", "createdAt", "updatedAt")
          VALUES (
            $1,
            $2,
            1,
            CASE WHEN $3 IS NOT NULL THEN ARRAY[$3]::date[] ELSE ARRAY[]::date[] END,
            NOW(),
            NOW()
          )
          ON CONFLICT ("itemName", "categoryId") DO UPDATE
          SET
            "audienceSize" = wishlist_aggregates."audienceSize" + 1,
            "targetDates" = CASE
                              WHEN $3 IS NOT NULL THEN array_append(wishlist_aggregates."targetDates", $3)
                              ELSE wishlist_aggregates."targetDates"
                            END,
            "updatedAt" = NOW();
        `;

        await manager.query(upsertQuery, [
          normalizedItemName,
          categoryId,
          createWishlistDto.targetDate || null, // Ensure null is passed if undefined
        ]);
      }

      return savedItem;
    });
  }

  async getWishlistInsights(): Promise<WishlistAggregate[]> {
    return this.wishlistAggregateRepository.find();
  }
}
