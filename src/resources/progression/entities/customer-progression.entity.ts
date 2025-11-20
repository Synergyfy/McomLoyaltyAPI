import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { CustomerBadge } from './customer-badge.entity';

@Entity('customer_progressions')
export class CustomerProgression extends AbstractBaseEntity {
    @OneToOne(() => Participant)
    @JoinColumn()
    participant: Participant;

    @Column()
    participantId: string;

    @ManyToOne(() => CustomerBadge, (badge) => badge.progressions)
    currentBadge: CustomerBadge;

    @Column()
    currentBadgeId: string;

    @Column({ type: 'int', default: 0 })
    currentPoints: number;

    @Column({ type: 'int', default: 0 })
    totalCampaignsJoined: number;

    @Column({ default: false })
    isManualOverride: boolean;
}
