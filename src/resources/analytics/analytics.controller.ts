import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ChartQueryDto, ChartResponseDto } from './dto/chart-analytics.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/interfaces/user.interface';
import { GeneralAnalyticsDto } from './dto/general-analytics.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SystemOverviewDto, CustomerActivityGrowthQueryDto, CustomerActivityGrowthDto, TopBusinessesResponseDto } from './dto/admin-analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('admin/system-overview')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get system-wide overview analytics',
    description: 'Accessible by admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'System overview data.',
    type: SystemOverviewDto,
  })
  getSystemOverview(): Promise<SystemOverviewDto> {
    return this.analyticsService.getSystemOverview();
  }

  @Get('admin/customer-activity-growth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer activity and growth analytics',
    description: 'Accessible by admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer activity and growth data.',
    type: CustomerActivityGrowthDto,
  })
  getCustomerActivityAndGrowth(@Query() query: CustomerActivityGrowthQueryDto): Promise<CustomerActivityGrowthDto> {
    return this.analyticsService.getCustomerActivityAndGrowth(query.days);
  }

  @Get('admin/top-businesses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top 10 performing businesses',
    description: 'Accessible by admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Top 10 performing businesses.',
    type: TopBusinessesResponseDto,
  })
  async getTopBusinesses(): Promise<TopBusinessesResponseDto> {
    const ranking = await this.analyticsService.getTopBusinesses();
    return { ranking };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get general analytics for a business',
    description: 'Accessible by business users.',
  })
  @ApiResponse({
    status: 200,
    description: 'General analytics data.',
    type: GeneralAnalyticsDto,
  })
  getGeneralAnalytics(@CurrentUser() user: User): Promise<GeneralAnalyticsDto> {
    return this.analyticsService.getGeneralAnalytics(user);
  }

  @Get('chart')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get chart analytics for a business',
    description: 'Accessible by business users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chart analytics data.',
    type: ChartResponseDto,
  })
  getChartAnalytics(
    @CurrentUser() user: User,
    @Query() query: ChartQueryDto,
  ): Promise<ChartResponseDto> {
    return this.analyticsService.getChartAnalytics(user, query.period);
  }
}
