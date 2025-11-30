import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { BusinessModule } from '../business/business.module';
import { StaffModule } from '../staff/staff.module';
import { HashModule } from '../../common/hash/hash.module';
import { MatchingPointsService } from '../participant-campaign-balance/services/matching-points.service';
import { Participant } from '../participant/entities/participant.entity';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { CampaignModule } from '../campaign/campaign.module';
import { ParticipantModule } from '../participant/participant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Participant, PointHistory, Campaign]),
    BusinessModule,
    StaffModule,
    HashModule,
    CampaignModule,
    ParticipantModule,
  ],
  providers: [AdminService, MatchingPointsService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule { }