import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';

import { Tier } from '../tier/entities/tier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, PaymentHistory, Tier])],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule { }
