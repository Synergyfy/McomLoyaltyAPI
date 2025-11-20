import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { BusinessProgression } from './business-progression.entity';


@Entity('business_levels')
export class BusinessLevel extends AbstractBaseEntity {
    @Column({ unique: true })
    name: string; // Starter, Active, Trusted, Partner

    @Column({ type: 'int', default: 0 })
    minPoints: number;

    @Column({ type: 'int', nullable: true })
    maxPoints: number; // Null for the highest tier

    @Column({ type: 'int', default: 0 })
    minCampaigns: number;

    @Column({ type: 'int', nullable: true })
    maxCampaigns: number;

    @Column('simple-array', { nullable: true })
    privileges: string[];

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => BusinessProgression, (progression) => progression.currentLevel)
    progressions: BusinessProgression[];
}
