import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Point } from '../../point/entities/point.entity';
import { PointHistory } from '../../point/entities/point-history.entity';

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

  @OneToMany(() => Point, (point) => point.participant)
  points: Point[];

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.participant)
  pointHistories: PointHistory[];
}
