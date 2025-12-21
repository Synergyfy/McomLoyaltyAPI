import { Module } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { SectorModule } from "../sector/sector.module";
import { SubCategory } from "../subcategory/entities/subcategory.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Category, SubCategory]), SectorModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
