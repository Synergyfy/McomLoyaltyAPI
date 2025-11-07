import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Point } from '../point/entities/point.entity';
import { PointHistory } from '../point/entities/point-history.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant, Campaign, Point, PointHistory]),
    AuthModule,
  ],
  controllers: [ParticipantController],
  providers: [ParticipantService],
})
export class ParticipantModule {}
