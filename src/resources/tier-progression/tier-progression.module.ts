import { Module, forwardRef } from '@nestjs/common';
import { MembershipModule } from '../membership/membership.module';
import { CampaignModule } from '../campaign/campaign.module';
import { RewardsModule } from '../rewards/rewards.module';
import { ParticipantCampaignBalanceModule } from '../participant-campaign-balance/participant-campaign-balance.module';
import { CapabilityModule } from '../capability/capability.module';

import { AnalyticsModule } from '../analytics/analytics.module';
import { TierProgressionService } from './tier-progression.service';

@Module({
    imports: [
        MembershipModule,
        forwardRef(() => CampaignModule),
        RewardsModule,
        ParticipantCampaignBalanceModule,
        forwardRef(() => CapabilityModule),
        AnalyticsModule
    ],
    providers: [TierProgressionService],
    exports: [TierProgressionService],
})
export class TierProgressionModule { }
