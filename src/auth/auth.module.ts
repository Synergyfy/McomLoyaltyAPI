import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { HashModule } from '../common/hash/hash.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { OtpModule } from '../resources/otp/otp.module';
import { MailModule } from '../mail/mail.module';
import { BusinessModule } from '../resources/business/business.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../resources/membership/entities/membership.entity';

@Module({
  controllers: [AuthController],
  imports: [
    TypeOrmModule.forFeature([Membership]),
    UserModule,
    BusinessModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<number>('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    HashModule,
    OtpModule,
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}