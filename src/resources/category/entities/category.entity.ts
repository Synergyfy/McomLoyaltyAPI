
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Sector } from '../../sector/entities/sector.entity';
import { SubCategory } from '../../subcategory/entities/subcategory.entity';

@Entity('categories')
export class Category extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => Sector, (sector) => sector.categories, { onDelete: 'CASCADE' })
  sector: Sector;

  @OneToMany(() => SubCategory, (subCategory) => subCategory.category)
  subCategories: SubCategory[];
}
