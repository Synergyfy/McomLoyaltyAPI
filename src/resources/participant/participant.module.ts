import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Wallet } from './entities/wallet.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant, Campaign, Wallet]),
    AuthModule,
  ],
  controllers: [ParticipantController],
  providers: [ParticipantService],
})
export class ParticipantModule {}
