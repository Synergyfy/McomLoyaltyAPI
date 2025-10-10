
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AdminService } from '../services/admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../entities/admin.entity';
import { HashModule } from '../../common/hash/hash.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
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
  providers: [AuthService, JwtStrategy, LocalStrategy, AdminService],
  exports: [AuthService],
})
export class AuthModule {}
