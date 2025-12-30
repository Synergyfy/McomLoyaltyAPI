import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MallIntegrationService } from "./mall-integration.service";
import { MallIntegrationController } from "./mall-integration.controller";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [HttpModule, ConfigModule, JwtModule.register({})],
  controllers: [MallIntegrationController],
  providers: [MallIntegrationService],
  exports: [MallIntegrationService],
})
export class MallIntegrationModule {}
