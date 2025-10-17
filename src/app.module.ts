import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import dataSource from './database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import commissionConfig from './config/commission.config';
import { BusinessModule } from './resources/business/business.module';
import { SectorModule } from './resources/sector/sector.module';
import { AdminModule } from './resources/admin/admin.module';
import { StaffModule } from './resources/staff/staff.module';
import { RewardsModule } from './resources/rewards/rewards.module';

@Module({
  imports: [
    BusinessModule,
    SectorModule,
    AdminModule,
    StaffModule,
    RewardsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [commissionConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...dataSource.options,
      }),
      dataSourceFactory: async () => dataSource,
    }),

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
