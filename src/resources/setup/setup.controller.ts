import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SetupService } from "./setup.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../common/role.enum";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("Setup")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("setup")
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @ApiOperation({ summary: "Check setup status" })
  @Get("status")
  async getSetupStatus(@CurrentUser() user: any) {
    if (user.role === Role.Admin) {
      return this.setupService.getAdminSetupStatus();
    } else {
      return this.setupService.getBusinessSetupStatus(user.id, user.role);
    }
  }
}
