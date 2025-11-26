
import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistAggregate } from './entities/wishlist-aggregate.entity';
import { WishlistAggregationService } from './wishlist-aggregation.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistItem, WishlistAggregate, Category]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistAggregationService],
})
export class WishlistModule {}
