import { Module } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { ParticipantController } from "./participant.controller";
import { AdminParticipantController } from "./admin.participant.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Participant } from "./entities/participant.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";
import { AuthModule } from "src/auth/auth.module";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { MailModule } from "../../mail/mail.module";
import { OtpModule } from "../otp/otp.module";
import { ParticipantProgressionModule } from "../participant-progression/participant-progression.module";
import { ReferralModule } from "../referral/referral.module";
import { RewardsModule } from "../rewards/rewards.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Participant,
      Campaign,
      PointHistory,
      ParticipantCampaignBalance,
      BusinessCampaign,
    ]),
    AuthModule,
    MailModule,
    OtpModule,
    ParticipantProgressionModule,
    ReferralModule,
    RewardsModule,
  ],
  controllers: [ParticipantController, AdminParticipantController],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
