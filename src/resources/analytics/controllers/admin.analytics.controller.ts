import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { Role } from 'src/common/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  SystemOverviewDto,
  TopBusinessDto,
  TopRewardDto,
} from '../dto/admin_analytics.dto';
import { AdminAnalyticsService } from '../services/admin.analytics.service';

@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('system-overview')
  @ApiOperation({
    summary: 'Get a system-wide overview.',
    description: 'Accessible only by admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provides a summary of total campaigns, participants, and redemptions.',
    type: SystemOverviewDto,
  })
  getSystemOverview(): Promise<SystemOverviewDto> {
    return this.adminAnalyticsService.getSystemOverview();
  }

  @Get('top-businesses')
  @ApiOperation({
    summary: 'Get the top 10 performing businesses.',
    description: 'Accessible only by admins. Businesses are ranked by the sum of points earned and redeemed.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of the top 10 businesses with their point totals.',
    type: [TopBusinessDto],
  })
  getTopBusinesses(): Promise<TopBusinessDto[]> {
    return this.adminAnalyticsService.getTopBusinesses();
  }

  @Get('top-rewards')
  @ApiOperation({
    summary: 'Get the top 10 most popular rewards.',
    description: 'Accessible only by admins. Rewards are ranked by the total number of redemptions.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of the top 10 rewards with their redemption counts.',
    type: [TopRewardDto],
  })
  getTopRewards(): Promise<TopRewardDto[]> {
    return this.adminAnalyticsService.getTopRewards();
  }
}
