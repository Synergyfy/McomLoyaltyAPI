import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Referral } from "./entities/referral.entity";
import { ReferralService } from "./referral.service";
import { ReferralController } from "./referral.controller";
import { Participant } from "../participant/entities/participant.entity";
import { Business } from "../business/entities/business.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { MailModule } from "../../mail/mail.module";
import { ParticipantProgressionModule } from "../participant-progression/participant-progression.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, Participant, Campaign, Business]),
    MailModule,
    ParticipantProgressionModule,
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
