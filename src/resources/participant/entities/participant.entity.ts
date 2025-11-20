import { Entity, Column, ManyToMany, JoinTable, OneToMany, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PointHistory } from '../../participant-campaign-balance/entities/point-history.entity';
import { ParticipantCampaignBalance } from '../../participant-campaign-balance/entities/participant-campaign-balance.entity';
import { ReputationLevel } from '../../reputation/entities/reputation-level.entity';

@Entity('participants')
export class Participant extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  @Column({ unique: true })
  uniqueCode: string;

  @ManyToMany(() => Campaign, (campaign) => campaign.participants)
  @JoinTable()
  campaigns: Campaign[];

  @OneToMany(
    () => ParticipantCampaignBalance,
    (participantCampaignBalance) => participantCampaignBalance.participant,
  )
  participantCampaignBalances: ParticipantCampaignBalance[];

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.participant)
  pointHistories: PointHistory[];

  @Column({ default: 0 })
  global_total_points: number;

  @Column({ default: 0 })
  matching_points: number;

  @Column({ default: false })
  isDisabled: boolean;

  @ManyToOne(() => ReputationLevel, { nullable: true })
  reputationLevel: ReputationLevel;
}