import { Module } from '@nestjs/common';
import { TierService } from './tier.service';
import { TierController } from './tier.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from './entities/tier.entity';
import { TierHistory } from './entities/tier-history.entity';
import { Membership } from '../membership/entities/membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tier, TierHistory, Membership])],
  controllers: [TierController],
  providers: [TierService],
})
export class TierModule {}
