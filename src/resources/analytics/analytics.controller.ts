import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { ChartQueryDto, ChartResponseDto } from "./dto/chart-analytics.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/role.enum";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/common/interfaces/user.interface";
import { GeneralAnalyticsDto } from "./dto/general-analytics.dto";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/common/guards/roles.guard";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get general analytics for a business",
    description: "Accessible by business users.",
  })
  @ApiResponse({
    status: 200,
    description: "General analytics data.",
    type: GeneralAnalyticsDto,
  })
  getGeneralAnalytics(@CurrentUser() user: User): Promise<GeneralAnalyticsDto> {
    return this.analyticsService.getGeneralAnalytics(user);
  }

  @Get("chart")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get chart analytics for a business",
    description: "Accessible by business users.",
  })
  @ApiResponse({
    status: 200,
    description: "Chart analytics data.",
    type: ChartResponseDto,
  })
  getChartAnalytics(
    @CurrentUser() user: User,
    @Query() query: ChartQueryDto,
  ): Promise<ChartResponseDto> {
    return this.analyticsService.getChartAnalytics(user, query.period);
  }
}
