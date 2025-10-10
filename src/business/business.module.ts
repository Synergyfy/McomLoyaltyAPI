import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { AuthModule } from './auth/auth.module';
import { HashModule } from '../common/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), AuthModule, HashModule],
  providers: [BusinessService],
  controllers: [BusinessController],
})
export class BusinessModule {}
