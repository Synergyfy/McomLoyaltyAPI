import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { MatchingPointService } from "../services/matching-point.service";
import {
  MatchingPointActivityType,
  MatchingPointConfig,
} from "../entities/matching-point-config.entity";
import { MatchingPointHistory } from "../entities/matching-point-history.entity";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { UpdateMatchingPointConfigDto } from "../dto/update-config.dto";
import { ManualAdjustmentDto } from "../dto/manual-adjustment.dto";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { GetMatchingPointHistoryDto } from "../dto/get-history.dto";

@ApiTags("Matching Points")
@Controller("matching-points")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class MatchingPointController {
  constructor(private readonly matchingPointService: MatchingPointService) {}

  @Get("config")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Get all matching point configurations (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "List of matching point configurations",
    type: [MatchingPointConfig],
  })
  @ApiForbiddenResponse({ description: "Forbidden - Admin access required" })
  async getAllConfig() {
    return this.matchingPointService.getConfig();
  }

  @Put("config")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update matching point configuration (Admin only)" })
  @ApiBody({ type: UpdateMatchingPointConfigDto })
  @ApiResponse({
    status: 200,
    description: "The updated configuration",
    type: MatchingPointConfig,
  })
  @ApiForbiddenResponse({ description: "Forbidden - Admin access required" })
  async updateConfig(@Body() updateConfigDto: UpdateMatchingPointConfigDto) {
    return this.matchingPointService.setConfig(
      updateConfigDto.activity_type,
      updateConfigDto.points,
      updateConfigDto.is_active,
    );
  }

  @Post("adjust")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Manually adjust matching points for a business (Admin only)",
  })
  @ApiBody({ type: ManualAdjustmentDto })
  @ApiResponse({
    status: 201,
    description: "Points adjusted successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
  })
  @ApiForbiddenResponse({ description: "Forbidden - Admin access required" })
  async manualAdjustment(@Body() dto: ManualAdjustmentDto) {
    await this.matchingPointService.manualAdjustment(
      dto.businessId,
      dto.points,
      dto.description,
    );
    return { success: true, message: "Points adjusted successfully" };
  }

  @Get("history")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Get matching point history for current business" })
  @ApiResponse({
    status: 200,
    description: "Paginated matching point history",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/MatchingPointHistory" },
        },
        total: { type: "number" },
        page: { type: "number" },
        limit: { type: "number" },
        totalPages: { type: "number" },
        next: { type: "number", nullable: true },
        previous: { type: "number", nullable: true },
      },
    },
  })
  @ApiForbiddenResponse({ description: "Forbidden - Business access required" })
  async getHistory(
    @Request() req,
    @Query() queryDto: GetMatchingPointHistoryDto,
  ) {
    return this.matchingPointService.getHistory(req.user.id, queryDto);
  }

  @Get("balance")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Get current matching point balance for business" })
  @ApiResponse({
    status: 200,
    description: "Current matching point balance",
    schema: {
      type: "object",
      properties: {
        matching_points: { type: "number" },
      },
    },
  })
  async getBalance(@Request() req) {
    return this.matchingPointService.getMatchingPointsBalance(req.user.id);
  }
}
