import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { Referral } from '../referral/entities/referral.entity';
import { HashModule } from '../../common/hash/hash.module';
import { SectorModule } from '../sector/sector.module';
import { CategoryModule } from '../category/category.module';
import { SubcategoryModule } from '../subcategory/subcategory.module';
import { ReferralModule } from '../referral/referral.module';
import { StaffModule } from '../staff/staff.module';
import { PaymentHistoryModule } from '../payment-history/payment-history.module';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { AffiliateController } from './controllers/affiliate.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Referral]),
    HashModule,
    SectorModule,
    CategoryModule,
    SubcategoryModule,
    ReferralModule,
    StaffModule,
    PaymentHistoryModule,
  ],
  providers: [BusinessService],
  controllers: [BusinessController, AffiliateController],
  exports: [BusinessService],
})
export class BusinessModule { }