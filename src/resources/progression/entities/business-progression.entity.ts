import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { BusinessLevel } from './business-level.entity';

@Entity('business_progressions')
export class BusinessProgression extends AbstractBaseEntity {
    @OneToOne(() => Business)
    @JoinColumn()
    business: Business;

    @Column()
    businessId: string;

    @ManyToOne(() => BusinessLevel, (level) => level.progressions)
    currentLevel: BusinessLevel;

    @Column()
    currentLevelId: string;

    @Column({ type: 'int', default: 0 })
    currentPoints: number;

    @Column({ type: 'int', default: 0 })
    totalCampaignsCreated: number;

    @Column({ default: false })
    isManualOverride: boolean;
}
