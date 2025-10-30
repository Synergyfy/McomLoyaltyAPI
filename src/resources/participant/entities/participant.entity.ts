import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Wallet } from './wallet.entity';

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

  @ManyToMany(() => Campaign, (campaign) => campaign.participants)
  @JoinTable()
  campaigns: Campaign[];

  @OneToOne(() => Wallet, (wallet) => wallet.participant)
  wallet: Wallet;
}
