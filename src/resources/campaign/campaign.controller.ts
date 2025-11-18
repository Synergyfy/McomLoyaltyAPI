import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { Admin } from '../admin/entities/admin.entity';
import { Public } from 'src/common/decorators/public.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CampaignAnalyticsDto } from './dto/campaign-analytics.dto';
import { CampaignAnalyticsQueryDto } from './dto/campaign-analytics-query.dto';
import { User } from 'src/common/interfaces/user.interface';
import { CreateCampaignAdminDto } from './dto/create-campaign-admin.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Campaign, CampaignType, AudienceType } from './entities/campaign.entity';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({
    summary: 'Create a new campaign',
    description: 'Accessible by Admins and Business Owners.',
  })
  @ApiBody({
    description: 'Payload for creating a new campaign',
    type: CreateCampaignDto,
    examples: {
      business: {
        summary: 'Business User Payload',
        value: {
          name: 'Summer Sale',
          campaign_type: CampaignType.QR_CODE,
          campaign_message: 'Get 20% off on all products!',
          start_date: new Date(),
          end_date: new Date(),
          quantity: 100,
          audience_type: AudienceType.MEMBERS,
          banner_url: 'http://example.com/banner.jpg',
          cta_text: 'Shop Now',
          cta_background_color: '#FF0000',
          cta_text_color: '#FFFFFF',
          text_color: '#000000',
          background_color: '#FFFFFF',
          reward_ids: ['f9f2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2'],
        },
      },
      admin: {
        summary: 'Admin User Payload',
        value: {
          name: 'Admin Campaign',
          campaign_type: CampaignType.QR_CODE,
          campaign_message: 'Admin-created campaign',
          start_date: new Date(),
          end_date: new Date(),
          quantity: 50,
          audience_type: AudienceType.MEMBERS,
          banner_url: 'http://example.com/admin_banner.jpg',
          cta_text: 'Learn More',
          cta_background_color: '#0000FF',
          cta_text_color: '#FFFFFF',
          text_color: '#000000',
          background_color: '#FFFFFF',
          reward_ids: ['f9f2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2'],
          business_id: 'f9f2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The campaign has been successfully created.',
    type: Campaign,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Body() createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.create(createCampaignDto, currentUser);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({
    summary: 'Get all campaigns for the current user',
    description:
      'Admins get all campaigns, Business Owners get their own campaigns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of campaigns.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(
    @CurrentUser() currentUser: Business | Admin,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAll(currentUser, paginationDto);
  }

  @Get('business/:businessId')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get all campaigns for a specific business',
    description: 'Accessible by Admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of campaigns for the business.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAllByBusiness(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByBusiness(businessId, paginationDto);
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Business)
  @ApiOperation({
    summary: 'Get all campaigns created by admins',
    description: 'Accessible by Business Owners.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of admin-created campaigns.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAllByAdmin(@Query() paginationDto: PaginationDto) {
    return this.campaignService.findAllByAdmin(paginationDto);
  }

  @Get('ongoing')
  @Public()
  @ApiOperation({ summary: 'Get all ongoing campaigns' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of ongoing campaigns.',
  })
  findOngoingCampaigns() {
    return this.campaignService.findOngoingCampaigns();
  }

  @Get('all/public')
  @Public()
  @ApiOperation({ summary: 'Get all public campaigns' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of public campaigns.',
  })
  findAllPublic(@Query() query: any) {
    return this.campaignService.findAllPublic(query);
  }

  @Get('analytics')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Business)
  @ApiOperation({
    summary: 'Get paginated campaign analytics for the business.',
    description: 'Accessible by Business Owners.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of campaign analytics.',
    type: [CampaignAnalyticsDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getAnalytics(
    @CurrentUser() currentUser: User,
    @Query() query: CampaignAnalyticsQueryDto,
  ) {
    return this.campaignService.getAnalytics(currentUser, query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Get a campaign by ID' })
  @ApiResponse({ status: 200, description: 'Returns the campaign.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Campaign not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiBody({
    description: 'Payload for updating a campaign',
    type: UpdateCampaignDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The campaign has been successfully updated.',
    type: Campaign,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Campaign not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.update(id, updateCampaignDto, currentUser);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({
    status: 200,
    description: 'The campaign has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Campaign not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.remove(id, currentUser);
  }

  @Patch(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Toggle the status of a campaign' })
  @ApiResponse({
    status: 200,
    description: 'The campaign status has been successfully toggled.',
    type: Campaign,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Campaign not found.' })
  toggleCampaignStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.toggleCampaignStatus(id, currentUser);
  }
}
