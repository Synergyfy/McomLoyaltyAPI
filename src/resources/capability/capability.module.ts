import { Module, forwardRef } from "@nestjs/common";
import { CapabilityService } from "./capability.service";
import { MembershipModule } from "../membership/membership.module";
import { CampaignModule } from "../campaign/campaign.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { RewardsModule } from "../rewards/rewards.module";
import { Staff } from "../staff/entities/staff.entity";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [
    MembershipModule,
    forwardRef(() => CampaignModule),
    RewardsModule,
    TypeOrmModule.forFeature([PointHistory, Staff]),
    forwardRef(() => BusinessModule),
  ],
  providers: [CapabilityService],
  exports: [CapabilityService],
})
export class CapabilityModule {}
