import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StampService } from './services/stamp.service';
import { AdminStampController } from './controllers/admin-stamp.controller';
import { BusinessStampController } from './controllers/business-stamp.controller';
import { ParticipantStampController } from './controllers/participant-stamp.controller';
import { StampRewardTemplate } from './entities/stamp-reward-template.entity';
import { BusinessStampReward } from './entities/business-stamp-reward.entity';
import { StampCard } from './entities/stamp-card.entity';
import { StampEvent } from './entities/stamp-event.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Business } from '../business/entities/business.entity';
import { ParticipantCampaignBalanceModule } from '../participant-campaign-balance/participant-campaign-balance.module';
import { Staff } from '../staff/entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StampRewardTemplate,
      BusinessStampReward,
      StampCard,
      StampEvent,
      Participant,
      Business,
      Staff,
    ]),
    ParticipantCampaignBalanceModule, // For hybrid points
  ],
  controllers: [
    AdminStampController,
    BusinessStampController,
    ParticipantStampController,
  ],
  providers: [StampService],
  exports: [StampService],
})
export class StampModule {}
