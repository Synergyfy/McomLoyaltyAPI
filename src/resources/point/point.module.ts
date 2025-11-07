import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointService } from './point.service';
import { PointController } from './point.controller';
import { Point } from './entities/point.entity';
import { PointHistory } from './entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Staff } from '../staff/entities/staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Point, PointHistory, Participant, Campaign, Staff])],
  controllers: [PointController],
  providers: [PointService],
})
export class PointModule {}
