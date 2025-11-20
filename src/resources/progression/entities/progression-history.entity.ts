import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';

export enum ProgressionEntityType {
    BUSINESS = 'BUSINESS',
    CUSTOMER = 'CUSTOMER',
}

export enum ProgressionChangeReason {
    AUTOMATIC_UPGRADE = 'AUTOMATIC_UPGRADE',
    AUTOMATIC_DOWNGRADE = 'AUTOMATIC_DOWNGRADE',
    MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
    INITIAL_ASSIGNMENT = 'INITIAL_ASSIGNMENT',
}

@Entity('progression_history')
export class ProgressionHistory extends AbstractBaseEntity {
    @Column({ type: 'enum', enum: ProgressionEntityType })
    entityType: ProgressionEntityType;

    @Column()
    entityId: string;

    @Column({ nullable: true })
    fromLevelId: string; // Can be null if it's the first assignment

    @Column({ nullable: true })
    fromLevelName: string; // Snapshot for easier querying

    @Column()
    toLevelId: string;

    @Column()
    toLevelName: string; // Snapshot

    @Column({ type: 'enum', enum: ProgressionChangeReason })
    reason: ProgressionChangeReason;

    @Column({ nullable: true })
    changedBy: string; // User ID or 'SYSTEM'
}
