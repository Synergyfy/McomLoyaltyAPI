import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LibraryAssetsService } from "./library-assets.service";
import { LibraryAssetsController } from "./library-assets.controller";
import { LibraryAsset } from "./entities/library-asset.entity";
import { Business } from "../business/entities/business.entity";

@Module({
  imports: [TypeOrmModule.forFeature([LibraryAsset, Business])],
  controllers: [LibraryAssetsController],
  providers: [LibraryAssetsService],
  exports: [LibraryAssetsService],
})
export class LibraryAssetsModule {}
