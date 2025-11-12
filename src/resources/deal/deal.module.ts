
import { Module } from '@nestjs/common';
import { DealService } from './deal.service';
import { DealController } from './deal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from './entities/deal.entity';
import { CategoryModule } from '../category/category.module';
import { IsDateAfter } from './validators/is-date-after.validator';

@Module({
  imports: [TypeOrmModule.forFeature([Deal]), CategoryModule],
  controllers: [DealController],
  providers: [DealService, IsDateAfter],
})
export class DealModule {}
