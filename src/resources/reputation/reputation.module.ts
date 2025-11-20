import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { ReputationLevel } from './entities/reputation-level.entity';
import { ReputationLog } from './entities/reputation-log.entity';
import { Business } from '../business/entities/business.entity';
import { Participant } from '../participant/entities/participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReputationLevel,
      ReputationLog,
      Business,
      Participant,
    ]),
  ],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
