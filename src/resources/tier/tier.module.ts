import { Module } from '@nestjs/common';
import { TierService } from './tier.service';
import { TierController } from './tier.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from './entities/tier.entity';
import { TierLog } from './entities/tier-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tier, TierLog])],
  controllers: [TierController],
  providers: [TierService],
})
export class TierModule {}
