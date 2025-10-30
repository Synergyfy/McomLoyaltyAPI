import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../entities/participant.entity';

@Entity('wallets')
export class Wallet extends AbstractBaseEntity {
  @Column({ default: 0 })
  points: number;

  @OneToOne(() => Participant)
  @JoinColumn()
  participant: Participant;
}
