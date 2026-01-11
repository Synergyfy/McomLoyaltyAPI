import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QrPlaquesService } from "./qr-plaques.service";
import { QrPlaquesController } from "./qr-plaques.controller";
import { QrPlaque } from "./entities/qr-plaque.entity";
import { Partner } from "../partner/entities/partner.entity";
import { Business } from "../business/entities/business.entity";

import { Network } from "../network/entities/network.entity";
import { Referral } from "../referral/entities/referral.entity";
import { MailModule } from "../../mail/mail.module";
import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([QrPlaque, Partner, Business, Network, Referral]),
    MailModule,
    AuthModule,
  ],
  controllers: [QrPlaquesController],
  providers: [QrPlaquesService],
  exports: [QrPlaquesService],
})
export class QrPlaquesModule {}
