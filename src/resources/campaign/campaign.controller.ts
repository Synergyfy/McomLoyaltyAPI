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
} from '@nestjs/common';
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

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.create(createCampaignDto, currentUser);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  findAll(@CurrentUser() currentUser: Business | Admin) {
    return this.campaignService.findAll(currentUser);
  }

  @Get('ongoing')
  @Public()
  findOngoingCampaigns() {
    return this.campaignService.findOngoingCampaigns();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.update(id, updateCampaignDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.remove(id, currentUser);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Business)
  toggleCampaignStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: Business | Admin,
  ) {
    return this.campaignService.toggleCampaignStatus(id, currentUser);
  }
}