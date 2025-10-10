
import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../database/entities/base.entity';

@Entity('admins')
export class Admin extends AbstractBaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}
