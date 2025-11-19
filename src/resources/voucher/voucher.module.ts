import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { ParticipantCampaignBalanceModule } from '../participant-campaign-balance/participant-campaign-balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher]),
    ParticipantCampaignBalanceModule,
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
