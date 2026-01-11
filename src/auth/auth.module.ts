import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import jwtConfig from "../config/jwt.config";
import { LocalStrategy } from "./local.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { HashModule } from "../common/hash/hash.module";
import { OtpModule } from "../resources/otp/otp.module";
import { MailModule } from "../mail/mail.module";
import { BusinessModule } from "../resources/business/business.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Membership } from "../resources/membership/entities/membership.entity";
import { PartnerModule } from "../resources/partner/partner.module";
import { PartnerLocalStrategy } from "./partner-local.strategy";
import { Business } from "../resources/business/entities/business.entity";
import { Staff } from "../resources/staff/entities/staff.entity";
import { Participant } from "../resources/participant/entities/participant.entity";
import { ParticipantProgressionModule } from "../resources/participant-progression/participant-progression.module";
import { Network } from "../resources/network/entities/network.entity";
import { Partner } from "../resources/partner/entities/partner.entity";

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: { expiresIn: configService.get<number>("jwt.expiresIn") },
      }),
      inject: [ConfigService],
    }),
    HashModule,
    OtpModule,
    MailModule,
    forwardRef(() => BusinessModule),
    TypeOrmModule.forFeature([
      Membership,
      Business,
      Staff,
      Participant,
      Network,
      Partner,
    ]),
    PartnerModule,
    ParticipantProgressionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, PartnerLocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
