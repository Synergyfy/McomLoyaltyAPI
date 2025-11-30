import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { Public } from '../../../common/decorators/public.decorator';
import { MatchingPointsService } from '../../participant-campaign-balance/services/matching-points.service';
import { AwardMatchingPointsDto } from '../dto/award-matching-points.dto';
import { Participant } from '../../participant/entities/participant.entity';
import { ToggleMatchingPointsDto } from '../dto/toggle-matching-points.dto';
import { Campaign } from 'src/resources/campaign/entities/campaign.entity';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PageDto } from '../../../common/dto/page.dto';
import { Business } from '../../business/entities/business.entity';
import { UpdateBusinessDto } from '../../business/dto/update-business.dto';
import { Staff } from '../../staff/entities/staff.entity';
import { UpdateStaffDto } from '../../staff/dto/update-staff.dto';
import { UpdateCampaignDto } from '../../campaign/dto/update-campaign.dto';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly matchingPointsService: MatchingPointsService,
  ) { }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({
    status: 201,
    description: 'The admin has been successfully created.',
  })
  @ApiBody({ type: CreateAdminDto })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get all businesses' })
  @ApiResponse({
    status: 200,
    description: 'Return all businesses with pagination.',
  })
  @Get('businesses')
  async getBusinesses(
    @Query() paginationDto: PaginationDto,
  ): Promise<PageDto<Business>> {
    return this.adminService.getBusinesses(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get all staffs by business ID' })
  @ApiResponse({ status: 200, description: 'Return all staffs for a business.' })
  @Get('staffs/:businessId')
  async getStaffs(
    @Param('businessId') businessId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getStaffs(businessId, page, limit);
  }

  @Roles(Role.Admin)
  @Post('award-matching-points')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Award matching points to a participant' })
  @ApiResponse({
    status: 201,
    description: 'The matching points have been successfully awarded.',
    type: Participant,
  })
  @ApiBody({ type: AwardMatchingPointsDto })
  awardMatchingPoints(
    @Body() awardMatchingPointsDto: AwardMatchingPointsDto,
  ): Promise<Participant> {
    return this.matchingPointsService.award(awardMatchingPointsDto);
  }

  @Roles(Role.Admin)
  @Post('toggle-matching-points')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin: Toggle the matching points for a campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'The matching points have been successfully toggled.',
    type: Campaign,
  })
  @ApiBody({ type: ToggleMatchingPointsDto })
  toggleMatchingPoints(
    @Body() toggleMatchingPointsDto: ToggleMatchingPointsDto,
  ): Promise<Campaign> {
    return this.adminService.toggleMatchingPoints(
      toggleMatchingPointsDto.campaignId,
    );
  }

  @Roles(Role.Admin)
  @Get('businesses/:id')
  @ApiOperation({ summary: 'Admin: Get business details' })
  @ApiResponse({ status: 200, description: 'Return business details.' })
  async getBusiness(@Param('id') id: string) {
    return this.adminService.getBusiness(id);
  }

  @Roles(Role.Admin)
  @Patch('businesses/:id')
  @ApiOperation({ summary: 'Admin: Update or disable business' })
  @ApiResponse({ status: 200, description: 'Business updated.' })
  async updateBusiness(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.adminService.updateBusiness(id, updateBusinessDto);
  }

  @Roles(Role.Admin)
  @Get('staffs/details/:id')
  @ApiOperation({ summary: 'Admin: Get staff details' })
  @ApiResponse({ status: 200, description: 'Return staff details.' })
  async getStaffDetails(@Param('id') id: string) {
    return this.adminService.getStaff(id);
  }

  @Roles(Role.Admin)
  @Patch('staffs/:id')
  @ApiOperation({ summary: 'Admin: Update staff' })
  @ApiResponse({ status: 200, description: 'Staff updated.' })
  async updateStaff(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.adminService.updateStaff(id, updateStaffDto);
  }

  @Roles(Role.Admin)
  @Get('staffs/:id/activities')
  @ApiOperation({ summary: 'Admin: Get staff activities' })
  @ApiResponse({ status: 200, description: 'Return staff activities.' })
  async getStaffActivities(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.adminService.getStaffActivities(
      id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Roles(Role.Admin)
  @Get('campaigns/business/:businessId')
  @ApiOperation({ summary: 'Admin: Get campaigns of a specific business' })
  @ApiResponse({ status: 200, description: 'Return campaigns.' })
  async getBusinessCampaigns(
    @Param('businessId') businessId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.adminService.getBusinessCampaigns(
      businessId,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Roles(Role.Admin)
  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Admin: Update or disable campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated.' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.adminService.updateCampaign(id, updateCampaignDto);
  }

  @Roles(Role.Admin)
  @Get('participants/business/:businessId')
  @ApiOperation({ summary: 'Admin: Get participants of a specific business' })
  @ApiResponse({ status: 200, description: 'Return participants.' })
  async getBusinessParticipants(
    @Param('businessId') businessId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.adminService.getBusinessParticipants(
      businessId,
      paginationDto.page,
      paginationDto.limit,
    );
  }
}
