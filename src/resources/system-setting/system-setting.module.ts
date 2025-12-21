import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemSetting } from "./entities/system-setting.entity";
import { SystemSettingService } from "./services/system-setting.service";
import { SystemSettingController } from "./controllers/system-setting.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  controllers: [SystemSettingController],
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
