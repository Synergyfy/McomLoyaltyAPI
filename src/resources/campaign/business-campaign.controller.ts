import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BusinessCampaignService } from './business-campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Business Campaigns')
@Controller('business/campaigns')
@UseGuards(RolesGuard)
@Roles(Role.Business)
@ApiBearerAuth()
export class BusinessCampaignController {
  constructor(private readonly businessCampaignService: BusinessCampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign for the current business' })
  @ApiResponse({ status: 201, description: 'The campaign has been successfully created.' })
  createCampaign(@CurrentUser() user: User, @Body() createCampaignDto: CreateCampaignDto) {
    return this.businessCampaignService.createCampaign(user.id, createCampaignDto);
  }

  @Get('unadded')
  @ApiOperation({ summary: 'Get unadded admin campaigns for the current business' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of unadded admin campaigns.' })
  getUnaddedAdminCampaigns(@CurrentUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.businessCampaignService.getUnaddedAdminCampaigns(user.id, paginationDto);
  }

  @Post(':campaignId/add')
  @ApiOperation({ summary: 'Add an admin campaign to the current business' })
  @ApiResponse({ status: 201, description: 'The admin campaign has been successfully added.' })
  addAdminCampaign(@CurrentUser() user: User, @Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.businessCampaignService.addAdminCampaign(user.id, campaignId);
  }

  @Get('my-campaigns')
  @ApiOperation({ summary: 'Get campaigns created by the current business' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of campaigns created by the business.' })
  getMyCampaigns(@CurrentUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.businessCampaignService.getMyCampaigns(user.id, paginationDto);
  }

  @Get('added')
  @ApiOperation({ summary: 'Get added admin campaigns for the current business' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of added admin campaigns.' })
  getAddedAdminCampaigns(@CurrentUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.businessCampaignService.getAddedAdminCampaigns(user.id, paginationDto);
  }
}
