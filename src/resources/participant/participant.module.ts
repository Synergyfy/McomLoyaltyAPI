import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { AdminParticipantController } from './admin.participant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ParticipantCampaignBalance } from '../participant-campaign-balance/entities/participant-campaign-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      Campaign,
      PointHistory,
      ParticipantCampaignBalance,
    ]),
    AuthModule,
  ],
  controllers: [ParticipantController, AdminParticipantController],
  providers: [ParticipantService],
})
export class ParticipantModule {}