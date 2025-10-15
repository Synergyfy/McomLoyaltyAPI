import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { AtGuard } from '../../../common/guards/at.guard';
import { RewardsService } from '../services/rewards.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(RolesGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Admin endpoints
  @ApiOperation({ summary: 'Admin: Create a new reward' })
  @ApiResponse({ status: 201, description: 'The reward has been successfully created.' })
  @UseGuards(AtGuard)
  @Roles(Role.Admin)
  @Post('admin/rewards')
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.createReward(createRewardDto);
  }

  @ApiOperation({ summary: 'Admin: Get all rewards' })
  @ApiResponse({ status: 200, description: 'Return all rewards.' })
  @UseGuards(AtGuard)
  @Roles(Role.Admin)
  @Get('admin/rewards')
  async getRewards(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.rewardsService.getRewards(page, limit);
  }

  // Business endpoints
  @ApiOperation({ summary: 'Business: Get all rewards' })
  @ApiResponse({ status: 200, description: 'Return all rewards.' })
  @UseGuards(AtGuard)
  @Roles(Role.Business)
  @Get('business/rewards')
  async getBusinessRewards(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.rewardsService.getRewards(page, limit);
  }

  @ApiOperation({ summary: 'Business: Add a reward to business' })
  @ApiResponse({ status: 201, description: 'The reward has been successfully added to the business.' })
  @UseGuards(AtGuard)
  @Roles(Role.Business)
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
  @UseGuards(AtGuard)
  @Roles(Role.Business)
  @Delete('business/rewards/:rewardId')
  async removeRewardFromBusiness(@Param('rewardId') rewardId: string, @CurrentUser() user: any) {
    return this.rewardsService.removeRewardFromBusiness(rewardId, user.id);
  }
}
