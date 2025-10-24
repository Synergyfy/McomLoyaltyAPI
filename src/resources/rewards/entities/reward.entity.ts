import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';

import { ApiProperty } from '@nestjs/swagger';
import { RewardImage } from './reward-image.entity';

@Entity()
export class Reward extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column()
  points_required: number;

  @Column()
  value: number;

  @Column()
  description: string;

  @OneToMany(() => RewardImage, (image) => image.reward, { cascade: true })
  images: RewardImage[];

  @Column({ default: 0 })
  quantity: number;

  @ApiProperty({
    description: 'Indicates whether the reward is disabled',
    example: false,
  })
  @Column({ default: false })
  disabled: boolean;
}
