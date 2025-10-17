import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { HashModule } from '../../common/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), HashModule],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}