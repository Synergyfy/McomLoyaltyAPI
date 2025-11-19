import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Plaque } from './plaque.entity';

@Entity('scan_events')
export class ScanEvent extends AbstractBaseEntity {
  @ManyToOne(() => Plaque, (plaque) => plaque.scan_events)
  plaque: Plaque;

  @Column({ type: 'jsonb', nullable: true })
  scanner_info: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  location: Record<string, any>;

  @Column({ nullable: true })
  referrer: string;

  @Column({ type: 'jsonb', nullable: true })
  entry_params: Record<string, any>;
}
