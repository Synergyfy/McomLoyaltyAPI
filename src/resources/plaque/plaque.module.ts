import { Module } from '@nestjs/common';
import { PlaqueService } from './plaque.service';
import { PlaqueController } from './plaque.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plaque } from './entities/plaque.entity';
import { ScanEvent } from './entities/scan-event.entity';
import { BusinessModule } from '../business/business.module';
import { GroupModule } from '../group/group.module';
import { LedgerModule } from '../ledger/ledger.module';
import { NotificationModule } from '../notification/notification.module';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plaque, ScanEvent]),
    BusinessModule,
    GroupModule,
    LedgerModule,
    NotificationModule,
    AssetModule,
  ],
  controllers: [PlaqueController],
  providers: [PlaqueService],
  exports: [PlaqueService],
})
export class PlaqueModule {}