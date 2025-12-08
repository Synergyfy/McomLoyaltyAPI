import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CapabilityService } from './capability.service';
import { MembershipModule } from '../membership/membership.module';
import { CampaignModule } from '../campaign/campaign.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
    imports: [
        MembershipModule,

        forwardRef(() => RewardsModule),
        forwardRef(() => CampaignModule),
        TypeOrmModule.forFeature([PointHistory, Staff]),
    ],
    providers: [CapabilityService],
    exports: [CapabilityService],
})
export class CapabilityModule { }
