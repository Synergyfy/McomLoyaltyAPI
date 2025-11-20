import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
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

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly matchingPointsService: MatchingPointsService,
  ) {}

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
}
