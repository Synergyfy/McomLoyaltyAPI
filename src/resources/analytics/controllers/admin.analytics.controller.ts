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
    summary: 'Get a System-Wide Analytics Overview',
    description:
      'Retrieves high-level statistics for the entire platform, such as the total number of campaigns, participants, and reward redemptions. This endpoint is restricted to users with the Admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'A summary of key metrics for the entire system.',
    type: SystemOverviewDto,
    schema: {
      example: {
        totalCampaigns: 150,
        totalParticipants: 85,
        totalRedemptions: 520,
        totalBusiness: 50,
        totalMatchingPoints: 1000,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. JWT token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required Admin role.' })
  getSystemOverview(): Promise<SystemOverviewDto> {
    return this.adminAnalyticsService.getSystemOverview();
  }

  @Get('top-businesses')
  @ApiOperation({
    summary: 'Get Top 10 Performing Businesses',
    description:
      'Returns a list of the top 10 businesses, ranked by the combined total of points earned and redeemed in their campaigns. This provides insight into which businesses are driving the most engagement. This endpoint is restricted to users with the Admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'An array of the top 10 performing businesses.',
    type: [TopBusinessDto],
    schema: {
      example: [
        {
          id: 'b8e4b3a0-5b0a-4b0e-8b0a-5b0a4b0e8b0a',
          name: 'Global Tech Inc.',
          totalPointsEarned: 25000,
          totalPointsRedeemed: 15000,
        },
        {
          id: 'c1d4e5f0-6c1b-5c1f-9c1b-6c1b5c1f9c1b',
          name: 'Local Coffee Roasters',
          totalPointsEarned: 18000,
          totalPointsRedeemed: 12000,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. JWT token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required Admin role.' })
  getTopBusinesses(): Promise<TopBusinessDto[]> {
    return this.adminAnalyticsService.getTopBusinesses();
  }

  @Get('top-rewards')
  @ApiOperation({
    summary: 'Get Top 10 Most Popular Rewards',
    description:
      'Retrieves a list of the top 10 most redeemed rewards across all campaigns on the platform. This helps identify which rewards are most appealing to participants. This endpoint is restricted to users with the Admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'An array of the top 10 most redeemed rewards.',
    type: [TopRewardDto],
    schema: {
      example: [
        {
          id: 'r3e4b3a0-5b0a-4b0e-8b0a-5b0a4b0e8b0a',
          name: 'Free Espresso Shot',
          totalRedemptions: 550,
        },
        {
          id: 'r4d4e5f0-6c1b-5c1f-9c1b-6c1b5c1f9c1b',
          name: '10% Off Next Purchase',
          totalRedemptions: 420,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. JWT token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required Admin role.' })
  getTopRewards(): Promise<TopRewardDto[]> {
    return this.adminAnalyticsService.getTopRewards();
  }
}
