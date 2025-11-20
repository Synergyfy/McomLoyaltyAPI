import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { CustomerProgression } from './customer-progression.entity';


@Entity('customer_badges')
export class CustomerBadge extends AbstractBaseEntity {
    @Column({ unique: true })
    name: string; // Bronze, Silver, Gold, Platinum

    @Column({ type: 'int', default: 0 })
    minPoints: number;

    @Column({ type: 'int', nullable: true })
    maxPoints: number;

    @Column({ type: 'int', default: 0 })
    minCampaignsJoined: number;

    @Column({ type: 'int', nullable: true })
    maxCampaignsJoined: number;

    @Column('simple-array', { nullable: true })
    privileges: string[];

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => CustomerProgression, (progression) => progression.currentBadge)
    progressions: CustomerProgression[];
}
