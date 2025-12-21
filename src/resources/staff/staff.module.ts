import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Staff } from "./entities/staff.entity";
import { StaffService } from "./services/staff.service";
import { StaffController } from "./controllers/staff.controller";
import { HashModule } from "../../common/hash/hash.module";
import { CapabilityModule } from "../capability/capability.module";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, PointHistory]),
    HashModule,
    CapabilityModule,
  ],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}
