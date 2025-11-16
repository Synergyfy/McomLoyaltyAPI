import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { ApiProperty } from '@nestjs/swagger';

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

  @Column()
  image: string;

  @Column({ default: 0 })
  quantity: number;

  @ApiProperty({
    description: 'Indicates whether the reward is disabled',
    example: false,
  })
  @Column({ default: false })
  disabled: boolean;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
