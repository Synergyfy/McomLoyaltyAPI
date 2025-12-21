import { Entity, Column, ManyToOne, Index } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Sector } from "../../sector/entities/sector.entity";
import { Category } from "../../category/entities/category.entity";
import { SubCategory } from "../../subcategory/entities/subcategory.entity";

export enum LibraryAssetType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  OTHER = "OTHER",
}

export enum LibraryAssetOwnerType {
  BUSINESS = "BUSINESS",
  ADMIN = "ADMIN",
}

@Entity("library_assets")
export class LibraryAsset extends AbstractBaseEntity {
  @ApiProperty({ description: "The URL of the asset file" })
  @Column()
  url: string;

  @ApiProperty({ description: "The title of the asset" })
  @Index()
  @Column()
  title: string;

  @ApiProperty({ description: "The description of the asset", required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ enum: LibraryAssetType, description: "The type of the asset" })
  @Index()
  @Column({
    type: "enum",
    enum: LibraryAssetType,
    default: LibraryAssetType.IMAGE,
  })
  type: LibraryAssetType;

  @ApiProperty({
    enum: LibraryAssetOwnerType,
    description: "The owner type of the asset",
  })
  @Index()
  @Column({ type: "enum", enum: LibraryAssetOwnerType })
  ownerType: LibraryAssetOwnerType;

  @ApiProperty({
    type: () => Business,
    description: "The business that owns the asset",
    required: false,
  })
  @Index()
  @ManyToOne(() => Business, { nullable: true, onDelete: "CASCADE" })
  business: Business;

  @Column({ nullable: true })
  businessId: string;

  @ApiProperty({
    type: () => Sector,
    description: "The sector associated with the asset",
    required: false,
  })
  @Index()
  @ManyToOne(() => Sector, { nullable: true, onDelete: "SET NULL" })
  sector: Sector;

  @Column({ nullable: true })
  sectorId: string;

  @ApiProperty({
    type: () => Category,
    description: "The category associated with the asset",
    required: false,
  })
  @Index()
  @ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ApiProperty({
    type: () => SubCategory,
    description: "The subcategory associated with the asset",
    required: false,
  })
  @Index()
  @ManyToOne(() => SubCategory, { nullable: true, onDelete: "SET NULL" })
  subCategory: SubCategory;

  @Column({ nullable: true })
  subCategoryId: string;
}
