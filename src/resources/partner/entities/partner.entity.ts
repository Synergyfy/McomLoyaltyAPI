import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { SubCategory } from "../../subcategory/entities/subcategory.entity";
import { Sector } from "../../sector/entities/sector.entity";
import { Category } from "../../category/entities/category.entity";

@Entity("partners")
export class Partner extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column()
  businessName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;

  @ManyToOne(() => Sector)
  @JoinColumn({ name: "sector_id" })
  sector: Sector;

  @ManyToOne(() => Category)
  @JoinColumn({ name: "category_id" })
  category: Category;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: "sub_category_id" })
  subCategory: SubCategory;

  @Column()
  password: string;
}
