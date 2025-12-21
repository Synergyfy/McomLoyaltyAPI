import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Category } from "../../category/entities/category.entity";

@Entity("wishlist_aggregates")
@Index(["itemName", "category"], { unique: true })
export class WishlistAggregate extends AbstractBaseEntity {
  @Column()
  itemName: string;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category: Category;

  @Column({ type: "integer" })
  audienceSize: number;

  @Column({ type: "date", array: true })
  targetDates: Date[];
}
