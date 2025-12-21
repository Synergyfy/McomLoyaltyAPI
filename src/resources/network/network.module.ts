import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NetworkService } from "./network.service";
import { NetworkController } from "./network.controller";
import { Network } from "./entities/network.entity";
import { Business } from "../business/entities/business.entity";
import { Partner } from "../partner/entities/partner.entity";
import { Sector } from "../sector/entities/sector.entity";
import { Category } from "../category/entities/category.entity";
import { SubCategory } from "../subcategory/entities/subcategory.entity";
import { Tier } from "../tier/entities/tier.entity";
import { Membership } from "../membership/entities/membership.entity";
import { HashModule } from "../../common/hash/hash.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Network,
      Business,
      Partner,
      Sector,
      Category,
      SubCategory,
      Tier,
      Membership,
    ]),
    HashModule,
  ],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}
