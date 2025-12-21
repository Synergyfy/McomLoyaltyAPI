import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipantProgressionService } from "./participant-progression.service";
import { ParticipantProgressionController } from "./participant-progression.controller";
import { ParticipantBadge } from "./entities/participant-badge.entity";
import { Participant } from "../participant/entities/participant.entity";
import { EarningAction } from "./entities/earning-action.entity";
import { MailModule } from "../../mail/mail.module";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipantBadge,
      Participant,
      EarningAction,
      PointHistory,
    ]),
    MailModule,
  ],
  controllers: [ParticipantProgressionController],
  providers: [ParticipantProgressionService],
  exports: [ParticipantProgressionService],
})
export class ParticipantProgressionModule {}
