import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Partner } from '../../partner/entities/partner.entity';

export enum QrPlaqueStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    FOR_SALE = 'FOR_SALE',
    PENDING_ASSIGNMENT = 'PENDING_ASSIGNMENT',
}

@Entity('qr_plaques')
export class QrPlaque extends AbstractBaseEntity {
    @Column({ unique: true, length: 9 })
    code: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'code_master_id' })
    codeMaster: Business;

    @ManyToOne(() => Partner, { nullable: true })
    @JoinColumn({ name: 'assigned_partner_id' })
    assignedPartner: Partner;

    @ManyToOne(() => Business, { nullable: true })
    @JoinColumn({ name: 'assigned_business_id' })
    assignedBusiness: Business;

    @Column({ nullable: true })
    pendingInviteEmail: string;

    @Column({ nullable: true })
    pendingInviteCode: string;

    @Column({
        type: 'enum',
        enum: QrPlaqueStatus,
        default: QrPlaqueStatus.PENDING_ASSIGNMENT,
    })
    status: QrPlaqueStatus;
}
