import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sector } from "./entities/sector.entity";
import { SectorService } from "./services/sector.service";
import { SectorController } from "./controllers/sector.controller";
import { Category } from "../category/entities/category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Sector, Category])],
  controllers: [SectorController],
  providers: [SectorService],
  exports: [SectorService],
})
export class SectorModule {}
