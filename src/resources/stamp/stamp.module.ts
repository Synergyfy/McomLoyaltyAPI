import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StampService } from './services/stamp.service';
import { AdminStampController } from './controllers/admin-stamp.controller';
import { BusinessStampController } from './controllers/business-stamp.controller';
import { ParticipantStampController } from './controllers/participant-stamp.controller';
import { StampRewardTemplate } from './entities/stamp-reward-template.entity';
import { BusinessStampReward } from './entities/business-stamp-reward.entity';
import { StampCard } from './entities/stamp-card.entity';
import { StampEvent } from './entities/stamp-event.entity';
import { StampPackage } from './entities/stamp-package.entity';
import { BusinessStampPackage } from './entities/business-stamp-package.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Business } from '../business/entities/business.entity';
import { ParticipantCampaignBalanceModule } from '../participant-campaign-balance/participant-campaign-balance.module';
import { Staff } from '../staff/entities/staff.entity';
import { Tier } from '../tier/entities/tier.entity';
import { PaymentModule } from '../payment/payment.module';
import { StampPackageService } from './services/stamp-package.service';
import { StampPackageController } from './controllers/stamp-package.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StampRewardTemplate,
      BusinessStampReward,
      StampCard,
      StampEvent,
      StampPackage,
      BusinessStampPackage,
      Participant,
      Business,
      Staff,
      Tier,
    ]),
    forwardRef(() => ParticipantCampaignBalanceModule),
    PaymentModule,
  ],
  controllers: [
    AdminStampController,
    BusinessStampController,
    ParticipantStampController,
    StampPackageController,
  ],
  providers: [StampService, StampPackageService],
  exports: [StampService, StampPackageService],
})
export class StampModule { }
