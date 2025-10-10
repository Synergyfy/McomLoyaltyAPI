
import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';

@Entity('staff')
export class Staff extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToOne(() => Business, (business) => business.staff)
  business: Business;
}
