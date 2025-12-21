import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Admin } from "../resources/admin/entities/admin.entity";
import { Business } from "../resources/business/entities/business.entity";
import { Staff } from "../resources/staff/entities/staff.entity";
import { Participant } from "../resources/participant/entities/participant.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Business, Staff, Participant])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
