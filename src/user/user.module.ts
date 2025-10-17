import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../resources/admin/entities/admin.entity';
import { Business } from '../resources/business/entities/business.entity';
import { Staff } from '../resources/staff/entities/staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Business, Staff])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}