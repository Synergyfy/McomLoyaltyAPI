import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLevel } from './entities/business-level.entity';
import { CustomerBadge } from './entities/customer-badge.entity';
import { BusinessProgression } from './entities/business-progression.entity';
import { CustomerProgression } from './entities/customer-progression.entity';
import { ProgressionHistory } from './entities/progression-history.entity';
import { Business } from '../business/entities/business.entity';
import { Participant } from '../participant/entities/participant.entity';
import { ProgressionController } from './progression.controller';
import { ProgressionService } from './progression.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BusinessLevel,
            CustomerBadge,
            BusinessProgression,
            CustomerProgression,
            ProgressionHistory,
            Business,
            Participant,
        ]),
    ],
    controllers: [ProgressionController],
    providers: [ProgressionService],
    exports: [ProgressionService],
})
export class ProgressionModule { }
