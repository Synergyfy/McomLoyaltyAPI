import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MatchingPointController } from "./controllers/matching-point.controller";
import { MatchingPointService } from "./services/matching-point.service";
import { MatchingPointConfig } from "./entities/matching-point-config.entity";
import { MatchingPointHistory } from "./entities/matching-point-history.entity";
import { Business } from "../business/entities/business.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Admin } from "../admin/entities/admin.entity";
import { MatchingPointReward } from "./entities/matching-point-reward.entity";
import { MatchingPointRedemption } from "./entities/matching-point-redemption.entity";
import { MailModule } from "../../mail/mail.module";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchingPointConfig,
      MatchingPointHistory,
      Business,
      Participant,
      Admin,
      MatchingPointReward,
      MatchingPointRedemption,
    ]),
    MailModule,
  ],
  controllers: [MatchingPointController],
  providers: [MatchingPointService],
  exports: [MatchingPointService],
})
export class MatchingPointModule {}
