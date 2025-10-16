import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { RewardsService } from '../services/rewards.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Admin endpoints
  @ApiOperation({ summary: 'Admin: Create a new reward' })
  @ApiResponse({ status: 201, description: 'The reward has been successfully created.' })
  @Post('admin/rewards')
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.createReward(createRewardDto);
  }

  @ApiOperation({ summary: 'Admin: Get all rewards' })
  @ApiResponse({ status: 200, description: 'Return all rewards.' })
  @Get('admin/rewards')
  async getRewards(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.rewardsService.getRewards(page, limit);
  }

  // Business endpoints
  @ApiOperation({ summary: 'Business: Get all rewards' })
  @ApiResponse({ status: 200, description: 'Return all rewards.' })
  @Get('business/rewards')
  async getBusinessRewards(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.rewardsService.getRewards(page, limit);
  }

  @ApiOperation({ summary: 'Business: Add a reward to business' })
  @ApiResponse({ status: 201, description: 'The reward has been successfully added to the business.' })
  @Post('business/rewards/:rewardId')
  async addRewardToBusiness(
    @Param('rewardId') rewardId: string,
    @Body() createBusinessRewardDto: CreateBusinessRewardDto,
    @CurrentUser() user: any,
  ) {
    return this.rewardsService.addRewardToBusiness(rewardId, user.id, createBusinessRewardDto);
  }

  @ApiOperation({ summary: 'Business: Remove a reward from business' })
  @ApiResponse({ status: 200, description: 'The reward has been successfully removed from the business.' })
  @Delete('business/rewards/:rewardId')
  async removeRewardFromBusiness(@Param('rewardId') rewardId: string, @CurrentUser() user: any) {
    return this.rewardsService.removeRewardFromBusiness(rewardId, user.id);
  }
}
