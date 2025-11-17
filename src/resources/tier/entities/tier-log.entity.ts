
import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Admin } from '../../admin/entities/admin.entity';
import { Tier } from './tier.entity';

export enum TierAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity()
export class TierLog extends AbstractBaseEntity {
  @ManyToOne(() => Tier, { nullable: false })
  tier: Tier;

  @ManyToOne(() => Admin, { nullable: false })
  admin: Admin;

  @Column({
    type: 'enum',
    enum: TierAction,
  })
  action: TierAction;

  @Column('simple-json')
  details: any;
}
