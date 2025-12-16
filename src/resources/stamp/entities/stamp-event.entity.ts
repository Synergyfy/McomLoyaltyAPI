import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { StampCard } from './stamp-card.entity';
import { StampTriggerMethod } from '../enums/stamp-trigger-method.enum';

@Entity('stamp_events')
export class StampEvent extends AbstractBaseEntity {
  @ManyToOne(() => StampCard, (card) => card.events, { onDelete: 'CASCADE' })
  stampCard: StampCard;

  @Column({ type: 'enum', enum: StampTriggerMethod })
  trigger_method: StampTriggerMethod;

  // e.g., points added if hybrid
  @Column({ default: 0 })
  points_added: number;

  @Column({ nullable: true })
  metadata: string; // Store extra info like source, transaction ID, etc.
}
