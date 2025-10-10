
import {
  Entity,
  Column,
  ManyToOne,
} from 'typeorm';
import { AbstractBaseEntity } from '../../database/entities/base.entity';
import { Sector } from '../../sector/entities/sector.entity';

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

  @ManyToOne(() => Sector, (sector) => sector.businesses)
  sector: Sector;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia?: Record<string, string>;

  @Column({ unique: true })
  uniqueCode: string;
}
