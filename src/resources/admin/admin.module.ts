import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { BusinessModule } from '../business/business.module';
import { StaffModule } from '../staff/staff.module';
import { HashModule } from '../../common/hash/hash.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    BusinessModule,
    StaffModule,
    HashModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}