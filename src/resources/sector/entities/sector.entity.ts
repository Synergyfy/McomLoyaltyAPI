
import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';

@Entity('sectors')
export class Sector extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Business, (business) => business.sector)
  businesses: Business[];
}
