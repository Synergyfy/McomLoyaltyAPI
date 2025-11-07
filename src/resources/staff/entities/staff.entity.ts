import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { PointHistory } from '../../point/entities/point-history.entity';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Role } from '../../../common/role.enum';

@Entity('staff')
export class Staff extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToOne(() => Business, (business) => business.staff)
  business: Business;

  @Column({ type: 'enum', enum: Role, default: Role.Staff })
  role: Role;

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.awardedByStaff)
  pointHistories: PointHistory[];
}