import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { QrPlaque } from './qr-plaque.entity';

@Entity('qr_plaque_scans')
export class QrPlaqueScan extends AbstractBaseEntity {
    @CreateDateColumn({ name: 'scanned_at' })
    scannedAt: Date;

    @ManyToOne(() => QrPlaque, (plaque) => plaque.scans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'qr_plaque_id' })
    qrPlaque: QrPlaque;
}
