
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { AuthModule } from './auth/auth.module';
import { HashModule } from '../../common/hash/hash.module';
import { BusinessModule } from '../business/business.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    AuthModule,
    HashModule,
    BusinessModule,
    StaffModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
