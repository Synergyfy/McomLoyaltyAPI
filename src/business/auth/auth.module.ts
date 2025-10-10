
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { BusinessService } from '../services/business.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../entities/business.entity';
import { HashModule } from '../../common/hash/hash.module';
import { LocalStrategy } from './local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from '../../config/jwt.config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
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
  ],
  providers: [AuthService, JwtStrategy, BusinessService, LocalStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
