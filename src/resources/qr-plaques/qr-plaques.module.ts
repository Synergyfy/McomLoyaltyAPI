import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrPlaquesService } from './qr-plaques.service';
import { QrPlaquesController } from './qr-plaques.controller';
import { QrPlaque } from './entities/qr-plaque.entity';
import { QrPlaqueScan } from './entities/qr-plaque-scan.entity';
import { Partner } from '../partner/entities/partner.entity';
import { Business } from '../business/entities/business.entity';

import { Network } from '../network/entities/network.entity';
import { MailModule } from '../../mail/mail.module';

@Module({
    imports: [TypeOrmModule.forFeature([QrPlaque, QrPlaqueScan, Partner, Business, Network]), MailModule],
    controllers: [QrPlaquesController],
    providers: [QrPlaquesService],
    exports: [QrPlaquesService],
})
export class QrPlaquesModule { }
