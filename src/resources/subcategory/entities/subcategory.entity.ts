import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Category } from "../../category/entities/category.entity";
import { Business } from "../../business/entities/business.entity";

@Entity("subcategories")
export class SubCategory extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => Category, (category) => category.subCategories, {
    onDelete: "CASCADE",
  })
  category: Category;

  @OneToMany(() => Business, (business) => business.subCategory)
  businesses: Business[];
}
