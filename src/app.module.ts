import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import dataSource from "./database/data-source";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { LoggingMiddleware } from "./middleware/logging.middleware";
import { ConfigModule } from "@nestjs/config";
import commissionConfig from "./config/commission.config";
import { BusinessModule } from "./resources/business/business.module";
import { SectorModule } from "./resources/sector/sector.module";
import { AdminModule } from "./resources/admin/admin.module";
import { StaffModule } from "./resources/staff/staff.module";
import { RewardsModule } from "./resources/rewards/rewards.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { ImpersonationGuard } from "./common/guards/impersonation.guard";
import { MembershipGuard } from "./common/guards/membership.guard";
import { CampaignModule } from "./resources/campaign/campaign.module";
import { ParticipantModule } from "./resources/participant/participant.module";
import { CategoryModule } from "./resources/category/category.module";
import { SubcategoryModule } from "./resources/subcategory/subcategory.module";
import { MailModule } from "./mail/mail.module";
import { OtpModule } from "./resources/otp/otp.module";
import { DealModule } from "./resources/deal/deal.module";
import { ParticipantCampaignBalanceModule } from "./resources/participant-campaign-balance/participant-campaign-balance.module";
import { AnalyticsModule } from "./resources/analytics/analytics.module";
import { SeederModule } from "./seeder/seeder.module";
import { TierModule } from "./resources/tier/tier.module";
import { CouponModule } from "./resources/coupon/coupon.module";
import { MembershipModule } from "./resources/membership/membership.module";
import { PaymentHistoryModule } from "./resources/payment-history/payment-history.module";
import { PaymentModule } from "./resources/payment/payment.module";
import { PartnerModule } from "./resources/partner/partner.module";
import { WishlistModule } from "./resources/wishlist/wishlist.module";
import { CapabilityModule } from "./resources/capability/capability.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { SystemSettingModule } from "./resources/system-setting/system-setting.module";
import { PointPackageModule } from "./resources/point-package/point-package.module";
import { NotificationModule } from "./resources/notification/notification.module";
import { SetupModule } from "./resources/setup/setup.module";
import { MatchingPointModule } from "./resources/matching-point/matching-point.module";
import { ParticipantProgressionModule } from "./resources/participant-progression/participant-progression.module";
import { ReferralModule } from "./resources/referral/referral.module";
import { SeasonModule } from "./resources/season/season.module";

import { NetworkModule } from "./resources/network/network.module";
import { StampModule } from "./resources/stamp/stamp.module";
import { GroupCircleModule } from "./resources/group-circle/group-circle.module";
import { LibraryAssetsModule } from "./resources/library-assets/library-assets.module";

import { MallIntegrationModule } from "./resources/mall-integration/mall-integration.module";
import { WalletModule } from "./resources/wallet/wallet.module";
import { TrainingSupportModule } from "./resources/training-support/training-support.module";
import { ProvisionModule } from "./resources/provision/provision.module";
import { HelpRequestsModule } from "./resources/help-requests/help-requests.module";

@Module({
  imports: [
    LibraryAssetsModule,
    GroupCircleModule,
    StampModule,
    NetworkModule,
    SeederModule,
    MailModule,
    BusinessModule,
    ProvisionModule,
    SectorModule,
    CategoryModule,
    SubcategoryModule,
    AdminModule,
    StaffModule,
    RewardsModule,
    AuthModule,
    UserModule,
    WalletModule,
    MallIntegrationModule,
    HelpRequestsModule,
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
    PartnerModule,
    ParticipantProgressionModule,
    WishlistModule,
    CapabilityModule,
    SystemSettingModule,
    PointPackageModule,
    NotificationModule,
    SetupModule,
    SetupModule,
    MatchingPointModule,
    ReferralModule,
    SeasonModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TrainingSupportModule,
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
      useClass: ImpersonationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes("*");
  }
}
