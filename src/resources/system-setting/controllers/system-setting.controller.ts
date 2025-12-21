import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { SystemSettingService } from "../services/system-setting.service";
import { CreateSystemSettingDto } from "../dto/create-system-setting.dto";
import { SystemSetting } from "../entities/system-setting.entity";

@ApiTags("Admin System Settings")
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller("admin/settings")
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Post()
  @ApiOperation({ summary: "Set a system setting" })
  @ApiResponse({
    status: 201,
    description: "The setting has been successfully set.",
    type: SystemSetting,
  })
  async set(@Body() createSystemSettingDto: CreateSystemSettingDto) {
    return this.systemSettingService.set(createSystemSettingDto);
  }

  @Get(":key")
  @ApiOperation({ summary: "Get a system setting by key" })
  @ApiResponse({ status: 200, description: "The setting value." })
  async get(@Param("key") key: string) {
    const value = await this.systemSettingService.get(key);
    return { key, value };
  }

  @Get()
  @ApiOperation({ summary: "Get all system settings" })
  @ApiResponse({
    status: 200,
    description: "List of all settings.",
    type: [SystemSetting],
  })
  async findAll() {
    return this.systemSettingService.findAll();
  }
}
