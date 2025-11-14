import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';

@Entity()
export class BlockedIp extends AbstractBaseEntity {
  @Column({ unique: true })
  ip: string;
}
