import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, EntityManager } from "typeorm";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";
import { WishlistItem } from "./entities/wishlist-item.entity";
import { WishlistAggregate } from "./entities/wishlist-aggregate.entity";
import { Category } from "../category/entities/category.entity";
import { Business } from "../business/entities/business.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Role } from "../../common/role.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(WishlistAggregate)
    private readonly wishlistAggregateRepository: Repository<WishlistAggregate>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
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
        await this.addToAggregate(
          manager,
          normalizedItemName,
          categoryId,
          createWishlistDto.targetDate,
        );
      }

      return savedItem;
    });
  }

  async findMyWishlist(
    participant: Participant,
    paginationDto: PaginationDto,
  ): Promise<{
    data: WishlistItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.wishlistItemRepository.findAndCount({
      where: { participant: { id: participant.id } },
      relations: ["category"],
      take: limit,
      skip,
      order: {
        created_at: "DESC",
      },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getWishlistInsights(
    paginationDto: PaginationDto,
    user: { id: string; role: Role },
  ): Promise<{
    data: WishlistAggregate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === Role.Business) {
      const business = await this.businessRepository.findOne({
        where: { id: user.id },
        relations: ["category"],
      });

      if (business && business.category) {
        where.category = { id: business.category.id };
      } else {
        // If business has no category, return empty result
        return {
          data: [],
          total: 0,
          page,
          limit,
        };
      }
    }

    const [data, total] = await this.wishlistAggregateRepository.findAndCount({
      where,
      relations: ["category"],
      take: limit,
      skip,
      order: {
        audienceSize: "DESC",
      },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async update(
    id: string,
    updateWishlistDto: UpdateWishlistDto,
    participant: Participant,
  ): Promise<WishlistItem> {
    return this.dataSource.transaction(async (manager) => {
      const wishlistItemRepository = manager.getRepository(WishlistItem);
      const categoryRepository = manager.getRepository(Category);

      const wishlistItem = await wishlistItemRepository.findOne({
        where: { id, participant: { id: participant.id } },
        relations: ["category"],
      });

      if (!wishlistItem) {
        throw new NotFoundException(`Wishlist item with ID ${id} not found`);
      }

      // Capture original state for aggregate update
      const oldItemName = wishlistItem.itemName;
      const oldCategoryId = wishlistItem.category?.id;
      const oldTargetDate = wishlistItem.targetDate;
      const oldMarketingConsent = wishlistItem.marketingConsent;

      const { categoryId, ...rest } = updateWishlistDto;

      if (categoryId) {
        const category = await categoryRepository.findOne({
          where: { id: categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${categoryId} not found`,
          );
        }
        wishlistItem.category = category;
      }

      if (updateWishlistDto.itemName) {
        wishlistItem.itemName = updateWishlistDto.itemName.trim().toLowerCase();
      }

      Object.assign(wishlistItem, rest);

      const savedItem = await wishlistItemRepository.save(wishlistItem);

      // Handle Aggregate Updates
      const newItemName = savedItem.itemName;
      const newCategoryId = savedItem.category?.id;
      const newTargetDate = savedItem.targetDate;
      const newMarketingConsent = savedItem.marketingConsent;

      if (oldMarketingConsent) {
        const datesDifferent = this.areDatesDifferent(
          oldTargetDate,
          newTargetDate,
        );
        const keyFieldsChanged =
          oldItemName !== newItemName ||
          oldCategoryId !== newCategoryId ||
          datesDifferent;

        if (!newMarketingConsent || keyFieldsChanged) {
          await this.removeFromAggregate(
            manager,
            oldItemName,
            oldCategoryId,
            oldTargetDate,
          );
        }
      }

      if (newMarketingConsent) {
        const datesDifferent = this.areDatesDifferent(
          oldTargetDate,
          newTargetDate,
        );
        const keyFieldsChanged =
          oldItemName !== newItemName ||
          oldCategoryId !== newCategoryId ||
          datesDifferent;

        if (!oldMarketingConsent || keyFieldsChanged) {
          await this.addToAggregate(
            manager,
            newItemName,
            newCategoryId,
            newTargetDate,
          );
        }
      }

      return savedItem;
    });
  }

  async remove(id: string, participant: Participant): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const wishlistItemRepository = manager.getRepository(WishlistItem);
      const wishlistItem = await wishlistItemRepository.findOne({
        where: { id, participant: { id: participant.id } },
        relations: ["category"],
      });

      if (!wishlistItem) {
        throw new NotFoundException(`Wishlist item with ID ${id} not found`);
      }

      if (wishlistItem.marketingConsent) {
        await this.removeFromAggregate(
          manager,
          wishlistItem.itemName,
          wishlistItem.category?.id,
          wishlistItem.targetDate,
        );
      }

      await wishlistItemRepository.remove(wishlistItem);
    });
  }

  private async addToAggregate(
    manager: EntityManager,
    itemName: string,
    categoryId: string,
    targetDate: Date | string | null,
  ) {
    const upsertQuery = `
      INSERT INTO wishlist_aggregates ("itemName", "category_id", "audienceSize", "targetDates", "created_at", "updated_at")
      VALUES (
        $1,
        $2,
        1,
        CASE WHEN $3::date IS NOT NULL THEN ARRAY[$3::date] ELSE ARRAY[]::date[] END,
        NOW(),
        NOW()
      )
      ON CONFLICT ("itemName", "category_id") DO UPDATE
      SET
        "audienceSize" = wishlist_aggregates."audienceSize" + 1,
        "targetDates" = CASE
                          WHEN $3::date IS NOT NULL THEN array_append(wishlist_aggregates."targetDates", $3::date)
                          ELSE wishlist_aggregates."targetDates"
                        END,
        "updated_at" = NOW();
    `;

    await manager.query(upsertQuery, [
      itemName,
      categoryId,
      targetDate || null,
    ]);
  }

  private async removeFromAggregate(
    manager: EntityManager,
    itemName: string,
    categoryId: string,
    targetDate: Date | string | null,
  ) {
    const removeQuery = `
      UPDATE wishlist_aggregates
      SET
        "audienceSize" = GREATEST("audienceSize" - 1, 0),
        "targetDates" = CASE
                          WHEN $3::date IS NULL THEN "targetDates"
                          WHEN array_position("targetDates", $3::date) IS NOT NULL THEN
                            "targetDates"[1:array_position("targetDates", $3::date)-1] ||
                            "targetDates"[array_position("targetDates", $3::date)+1:]
                          ELSE "targetDates"
                        END,
        "updated_at" = NOW()
      WHERE "itemName" = $1 AND "category_id" = $2
    `;

    await manager.query(removeQuery, [
      itemName,
      categoryId,
      targetDate || null,
    ]);
  }

  private areDatesDifferent(
    d1: Date | string | null,
    d2: Date | string | null,
  ): boolean {
    const t1 = d1 ? new Date(d1).getTime() : null;
    const t2 = d2 ? new Date(d2).getTime() : null;
    return t1 !== t2;
  }
}
