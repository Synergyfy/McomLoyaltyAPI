import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { BusinessStampReward } from './business-stamp-reward.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { StampCardStatus } from '../enums/stamp-card-status.enum';
import { StampEvent } from './stamp-event.entity';

@Entity('stamp_cards')
export class StampCard extends AbstractBaseEntity {
  @ManyToOne(() => BusinessStampReward, (reward) => reward.stampCards)
  businessStampReward: BusinessStampReward;

  @ManyToOne(() => Participant)
  participant: Participant;

  @Column({ default: 0 })
  current_stamps: number;

  @Column({ type: 'enum', enum: StampCardStatus, default: StampCardStatus.IN_PROGRESS })
  status: StampCardStatus;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  redeemed_at: Date;

  @OneToMany(() => StampEvent, (event) => event.stampCard)
  events: StampEvent[];
}
