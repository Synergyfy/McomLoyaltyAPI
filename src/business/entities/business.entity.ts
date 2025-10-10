
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../database/entities/base.entity';
import { Sector } from '../../sector/entities/sector.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @ManyToOne(() => Sector, (sector) => sector.businesses)
  sector: Sector;

  @OneToMany(() => Staff, (staff) => staff.business)
  staff: Staff[];

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia?: Record<string, string>;

  @Column({ unique: true })
  uniqueCode: string;
}
