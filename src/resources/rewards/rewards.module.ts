import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { RewardsController } from './controllers/rewards.controller';
import { RewardsService } from './services/rewards.service';
import { BusinessReward } from './entities/business-reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, BusinessReward])],
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}
