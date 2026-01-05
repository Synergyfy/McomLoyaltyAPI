import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LibraryAssetsService } from "./library-assets.service";
import { LibraryAssetsController } from "./library-assets.controller";
import { LibraryAsset } from "./entities/library-asset.entity";
import { Business } from "../business/entities/business.entity";
import { Staff } from "../staff/entities/staff.entity";

@Module({
  imports: [TypeOrmModule.forFeature([LibraryAsset, Business, Staff])],
  controllers: [LibraryAssetsController],
  providers: [LibraryAssetsService],
  exports: [LibraryAssetsService],
})
export class LibraryAssetsModule {}
