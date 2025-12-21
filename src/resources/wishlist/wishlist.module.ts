import { Module } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { WishlistController } from "./wishlist.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WishlistItem } from "./entities/wishlist-item.entity";
import { WishlistAggregate } from "./entities/wishlist-aggregate.entity";
import { Category } from "../category/entities/category.entity";
import { Business } from "../business/entities/business.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WishlistItem,
      WishlistAggregate,
      Category,
      Business,
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
