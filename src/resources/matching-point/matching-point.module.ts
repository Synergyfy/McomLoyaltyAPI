import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MatchingPointController } from "./controllers/matching-point.controller";
import { MatchingPointService } from "./services/matching-point.service";
import { MatchingPointConfig } from "./entities/matching-point-config.entity";
import { MatchingPointHistory } from "./entities/matching-point-history.entity";
import { Business } from "../business/entities/business.entity";
import { MailModule } from "../../mail/mail.module";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchingPointConfig,
      MatchingPointHistory,
      Business,
    ]),
    MailModule,
  ],
  controllers: [MatchingPointController],
  providers: [MatchingPointService],
  exports: [MatchingPointService],
})
export class MatchingPointModule {}
