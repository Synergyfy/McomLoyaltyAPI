
import {
  Entity,
  Column,
} from 'typeorm';
import { AbstractBaseEntity } from '../../database/entities/base.entity';

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  sector: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia?: Record<string, string>;
}
