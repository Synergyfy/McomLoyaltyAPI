import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { RewardType } from '../enums/reward-type.enum';
import { RewardSource } from '../enums/reward-source.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { RewardStatus } from '../enums/reward-status.enum';
import { Sector } from '../../sector/entities/sector.entity';
import { Tier } from '../../tier/entities/tier.entity';

@Entity()
export class Reward extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column()
  points_required: number;

  @Column({ type: 'enum', enum: RewardType })
  reward_type: RewardType;

  @Column({ type: 'enum', enum: RewardSource })
  reward_source: RewardSource;

  @Column({ type: 'enum', enum: RewardAudience })
  audience: RewardAudience;

  @Column({ type: 'timestamp', nullable: true })
  expiry_datetime: Date;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.ACTIVE,
  })
  status: RewardStatus;

  @ManyToMany(() => Sector)
  @JoinTable()
  sectors: Sector[];

  @ManyToMany(() => Tier)
  @JoinTable()
  tiers: Tier[];

  @Column()
  value: number;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: false })
  disabled: boolean;
}
