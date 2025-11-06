
import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('sectors')
export class Sector extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Category, (category) => category.sector)
  categories: Category[];
}
