
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { StaffService } from './services/staff.service';
import { StaffController } from './controllers/staff.controller';
import { AuthModule } from './auth/auth.module';
import { HashModule } from '../../common/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Staff]), AuthModule, HashModule],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}
