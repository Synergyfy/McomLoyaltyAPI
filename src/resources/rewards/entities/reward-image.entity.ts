import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Reward } from './reward.entity';

@Entity('reward_images')
export class RewardImage extends AbstractBaseEntity {
  @Column()
  url: string;

  @ManyToOne(() => Reward, (reward) => reward.images)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;
}
