import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { RewardsController } from './controllers/rewards.controller';
import { RewardsService } from './services/rewards.service';
import { BusinessReward } from './entities/business-reward.entity';
import { Business } from '../business/entities/business.entity';
import { Membership } from '../membership/entities/membership.entity';
import { Sector } from '../sector/entities/sector.entity';
import { Tier } from '../tier/entities/tier.entity';
import { CapabilityModule } from '../capability/capability.module';
import { forwardRef } from '@nestjs/common';
import { TierProgressionModule } from '../tier-progression/tier-progression.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reward,
      BusinessReward,
      Business,
      Membership,
      Sector,
      Tier,
    ]),
    forwardRef(() => CapabilityModule),
    forwardRef(() => TierProgressionModule),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule { }
