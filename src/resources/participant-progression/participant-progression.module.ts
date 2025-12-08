import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantProgressionService } from './participant-progression.service';
import { ParticipantProgressionController } from './participant-progression.controller';
import { ParticipantBadge } from './entities/participant-badge.entity';
import { Participant } from '../participant/entities/participant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ParticipantBadge, Participant])],
    controllers: [ParticipantProgressionController],
    providers: [ParticipantProgressionService],
    exports: [ParticipantProgressionService],
})
export class ParticipantProgressionModule { }
