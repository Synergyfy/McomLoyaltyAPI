
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sector } from './entities/sector.entity';
import { SectorService } from './services/sector.service';
import { SectorController } from './controllers/sector.controller';
import { AuthModule } from '../admin/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sector]), AuthModule],
  controllers: [SectorController],
  providers: [SectorService],
})
export class SectorModule {}
