import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { StampCard } from './stamp-card.entity';
import { StampTriggerMethod } from '../enums/stamp-trigger-method.enum';

@Entity('stamp_events')
export class StampEvent extends AbstractBaseEntity {
  /**
   * The stamp card that was updated by this event.
   */
  @ManyToOne(() => StampCard, (card) => card.events, { onDelete: 'CASCADE' })
  stampCard: StampCard;

  /**
   * How the stamp was earned (e.g., QR_SCAN).
   */
  @Column({ type: 'enum', enum: StampTriggerMethod })
  trigger_method: StampTriggerMethod;

  /**
   * Points awarded during this event (if hybrid mode is active).
   */
  @Column({ default: 0 })
  points_added: number;

  /**
   * Additional context (e.g., transaction ID, source).
   */
  @Column({ nullable: true })
  metadata: string; // Store extra info like source, transaction ID, etc.
}
