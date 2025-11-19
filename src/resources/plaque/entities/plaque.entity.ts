import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Group } from '../../group/entities/group.entity';
import { PlaqueStatus } from './enums/plaque-status.enum';
import { AttributionMode } from './enums/attribution-mode.enum';
import { ScanEvent } from './scan-event.entity';

@Entity('plaques')
export class Plaque extends AbstractBaseEntity {
  @ManyToOne(() => Group, (group) => group.plaques)
  group: Group;

  @ManyToOne(() => Business, (business) => business.ownedPlaques)
  @JoinColumn({ name: 'current_owner_id' })
  current_owner: Business;

  @ManyToOne(() => Business, (business) => business.originallySoldPlaques)
  @JoinColumn({ name: 'original_seller_id' })
  original_seller: Business;

  @ManyToOne(() => Business, (business) => business.lastSoldPlaques)
  @JoinColumn({ name: 'last_seller_id' })
  last_seller: Business;

  @Column({ type: 'enum', enum: PlaqueStatus, default: PlaqueStatus.AVAILABLE })
  status: PlaqueStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issue_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  transfer_history: Record<string, any>[];

  @Column({ nullable: true })
  placement_location_id: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  qr_code_url: string;

  @Column({ nullable: true })
  print_pdf_url: string;

  @Column({ type: 'decimal', nullable: true })
  price: number;

  @Column({ type: 'decimal', nullable: true })
  sold_price: number;

  @Column({ type: 'timestamp', nullable: true })
  date_assigned: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_sold: Date;

  @Column({ type: 'simple-array', nullable: true })
  linked_offer_ids: string[];

  @Column({ default: 0 })
  scan_count: number;

  @Column({ default: 0 })
  redemption_count: number;

  @Column({
    type: 'enum',
    enum: AttributionMode,
    default: AttributionMode.OWNER,
  })
  attribution_mode: AttributionMode;

  @Column({ type: 'jsonb', nullable: true })
  split_config: Record<string, any>;

  @OneToMany(() => ScanEvent, (scanEvent) => scanEvent.plaque)
  scan_events: ScanEvent[];
}