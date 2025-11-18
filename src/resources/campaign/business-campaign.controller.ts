import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { CampaignService } from './campaign.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Business Campaigns')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Business)
@Controller('business/campaigns')
export class BusinessCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('claimable')
  @ApiOperation({ summary: 'Get all claimable campaigns for a business' })
  async findClaimableCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findClaimableCampaigns(
      business.id,
      paginationDto,
    );
  }

  @Post(':campaignId/claim')
  @ApiOperation({ summary: 'Claim an admin-created campaign' })
  async claimCampaign(
    @CurrentUser() business: Business,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignService.claimCampaign(business.id, campaignId);
  }

  @Get('my-created-campaigns')
  @ApiOperation({ summary: 'Get all campaigns created by the business' })
  async findMyCreatedCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findAllByBusiness(business.id, paginationDto);
  }

  @Get('my-claimed-campaigns')
  @ApiOperation({ summary: 'Get all campaigns claimed by the business' })
  async findMyClaimedCampaigns(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.findClaimedCampaigns(
      business.id,
      paginationDto,
    );
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics for all campaigns associated with the business' })
  async getCampaignAnalytics(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignService.getCampaignAnalytics(
      business.id,
      paginationDto,
    );
  }

  @Get(':campaignId/analytics/detailed')
  @ApiOperation({ summary: 'Get detailed analytics for a campaign' })
  async getDetailedCampaignAnalytics(
    @CurrentUser() business: Business,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.campaignService.getDetailedCampaignAnalytics(
      business.id,
      campaignId,
    );
  }
}
