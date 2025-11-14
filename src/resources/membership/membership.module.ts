import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { PaymentHistoryModule } from '../payment-history/payment-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([Membership]), PaymentHistoryModule],
  controllers: [MembershipController],
  providers: [MembershipService],
})
export class MembershipModule {}
