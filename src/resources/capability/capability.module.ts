import { Module, forwardRef } from '@nestjs/common';
import { CapabilityService } from './capability.service';
import { MembershipModule } from '../membership/membership.module';
import { ProgressionModule } from '../progression/progression.module';
import { CampaignModule } from '../campaign/campaign.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
    imports: [
        MembershipModule,
        ProgressionModule,
        ProgressionModule,
        forwardRef(() => RewardsModule),
        forwardRef(() => CampaignModule),
    ],
    providers: [CapabilityService],
    exports: [CapabilityService],
})
export class CapabilityModule { }
