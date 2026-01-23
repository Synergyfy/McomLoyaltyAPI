import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Provision } from "./entities/provision.entity";
import { ProvisionService } from "./provision.service";
import { ProvisionController } from "./provision.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Provision])],
  controllers: [ProvisionController],
  providers: [ProvisionService],
  exports: [ProvisionService],
})
export class ProvisionModule {}
