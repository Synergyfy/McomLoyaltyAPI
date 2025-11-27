import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import dataSource from './database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { ConfigModule } from '@nestjs/config';
import commissionConfig from './config/commission.config';
import { BusinessModule } from './resources/business/business.module';
import { SectorModule } from './resources/sector/sector.module';
import { AdminModule } from './resources/admin/admin.module';
import { StaffModule } from './resources/staff/staff.module';
import { RewardsModule } from './resources/rewards/rewards.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CampaignModule } from './resources/campaign/campaign.module';
import { ParticipantModule } from './resources/participant/participant.module';
import { CategoryModule } from './resources/category/category.module';
import { SubcategoryModule } from './resources/subcategory/subcategory.module';
import { MailModule } from './mail/mail.module';
import { OtpModule } from './resources/otp/otp.module';
import { DealModule } from './resources/deal/deal.module';
import { ParticipantCampaignBalanceModule } from './resources/participant-campaign-balance/participant-campaign-balance.module';
import { AnalyticsModule } from './resources/analytics/analytics.module';
import { SeederModule } from './seeder/seeder.module';
import { TierModule } from './resources/tier/tier.module';
import { CouponModule } from './resources/coupon/coupon.module';
import { MembershipModule } from './resources/membership/membership.module';
import { PaymentHistoryModule } from './resources/payment-history/payment-history.module';
import { PaymentModule } from './resources/payment/payment.module';
import { ProgressionModule } from './resources/progression/progression.module';
import { PartnerModule } from './resources/partner/partner.module';
import { WishlistModule } from './resources/wishlist/wishlist.module';
import { CapabilityModule } from './resources/capability/capability.module';

@Module({
  imports: [
    SeederModule,
    MailModule,
    BusinessModule,
    SectorModule,
    CategoryModule,
    SubcategoryModule,
    AdminModule,
    StaffModule,
    RewardsModule,
    AuthModule,
    UserModule,
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
    CampaignModule,
    ParticipantModule,
    OtpModule,
    DealModule,
    ParticipantCampaignBalanceModule,
    AnalyticsModule,
    TierModule,
    CouponModule,
    MembershipModule,
    PaymentHistoryModule,
    PaymentModule,
    ProgressionModule,
    PartnerModule,
    WishlistModule,
    CapabilityModule,
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}