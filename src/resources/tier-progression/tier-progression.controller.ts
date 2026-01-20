import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { TierProgressionService } from "./tier-progression.service";
import { BusinessProgressionResponseDto } from "./dto/business-progression-response.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Tier Progression")
@Controller("tier-progression")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TierProgressionController {
  constructor(private readonly progressionService: TierProgressionService) {}

  @Get("my-progression")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Get the current business's progression details" })
  @ApiResponse({
    status: 200,
    description:
      "Returns detailed progression metrics and next level requirements.",
    type: BusinessProgressionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Membership not found." })
  async getMyProgression(@Req() req) {
    return this.progressionService.getDetailedProgression(req.user.id);
  }
}
