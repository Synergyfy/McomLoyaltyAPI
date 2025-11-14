import { Module } from '@nestjs/common';
import { TierService } from './tier.service';
import { TierController } from './tier.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from './entities/tier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tier])],
  controllers: [TierController],
  providers: [TierService],
})
export class TierModule {}
