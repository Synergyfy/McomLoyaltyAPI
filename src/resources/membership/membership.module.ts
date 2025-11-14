import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, PaymentHistory])],
  controllers: [MembershipController],
  providers: [MembershipService],
})
export class MembershipModule {}
