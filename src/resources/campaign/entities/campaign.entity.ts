import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Reward } from '../../rewards/entities/reward.entity';

@Entity('campaigns')
export class Campaign extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  main_image: string;

  @Column('simple-array')
  gallery: string[];

  @ManyToMany(() => Reward)
  @JoinTable()
  rewards: Reward[];

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ default: false })
  disabled: boolean;

  @Column()
  text_color: string;

  @Column()
  background_color: string;
}