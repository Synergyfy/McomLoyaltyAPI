import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';

@Entity('points')
export class Point extends AbstractBaseEntity {
  @ManyToOne(() => Participant, (participant) => participant.points)
  participant: Participant;

  @ManyToOne(() => Campaign, (campaign) => campaign.points)
  campaign: Campaign;

  @Column({ default: 0 })
  balance: number;
}