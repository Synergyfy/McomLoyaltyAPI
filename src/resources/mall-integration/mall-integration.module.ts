import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MallIntegrationService } from "./mall-integration.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MallIntegrationService],
  exports: [MallIntegrationService],
})
export class MallIntegrationModule {}
