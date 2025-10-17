import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { StaffService } from './services/staff.service';
import { StaffController } from './controllers/staff.controller';
import { HashModule } from '../../common/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Staff]), HashModule],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}