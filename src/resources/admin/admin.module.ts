
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { AuthModule } from './auth/auth.module';
import { HashModule } from '../../common/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), AuthModule, HashModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
