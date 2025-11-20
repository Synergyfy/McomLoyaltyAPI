import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { RewardsController } from './controllers/rewards.controller';
import { RewardsService } from './services/rewards.service';
import { BusinessReward } from './entities/business-reward.entity';
import { Business } from '../business/entities/business.entity';
import { Membership } from '../membership/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, BusinessReward, Business, Membership]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
