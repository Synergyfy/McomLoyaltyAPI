import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Business } from '../../business/entities/business.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity('point_histories')
export class PointHistory extends AbstractBaseEntity {
  @ManyToOne(() => Participant, (participant) => participant.pointHistories)
  participant: Participant;

  @ManyToOne(() => Campaign, (campaign) => campaign.pointHistories)
  campaign: Campaign;

  @Column()
  points: number;

  @Column()
  code: string;

  @ManyToOne(() => Business, (business) => business.pointHistories)
  awardedByBusiness: Business;

  @ManyToOne(() => Staff, (staff) => staff.pointHistories)
  awardedByStaff: Staff;
}