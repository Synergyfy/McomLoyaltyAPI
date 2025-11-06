import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { HashModule } from '../../common/hash/hash.module';
import { SectorModule } from '../sector/sector.module';
import { CategoryModule } from '../category/category.module';
import { SubcategoryModule } from '../subcategory/subcategory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    HashModule,
    SectorModule,
    CategoryModule,
    SubcategoryModule,
  ],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}