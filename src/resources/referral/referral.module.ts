import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { ReferralService } from './services/referral.service';

@Module({
  imports: [TypeOrmModule.forFeature([Referral])],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
