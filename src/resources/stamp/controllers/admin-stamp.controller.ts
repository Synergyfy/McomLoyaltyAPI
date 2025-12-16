import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { StampService } from '../services/stamp.service';
import { CreateStampTemplateDto } from '../dto/create-stamp-template.dto';
import { UpdateStampTemplateDto } from '../dto/update-stamp-template.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { StampRewardTemplate } from '../entities/stamp-reward-template.entity';

@ApiTags('Admin Stamp Rewards')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('admin/stamps')
export class AdminStampController {
  constructor(private readonly stampService: StampService) {}

  @Post('templates')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new Stamp Reward Template' })
  @ApiCreatedResponse({ type: StampRewardTemplate })
  create(@Body() dto: CreateStampTemplateDto) {
    return this.stampService.createTemplate(dto);
  }

  @Get('templates')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'List all Stamp Reward Templates' })
  @ApiOkResponse({ type: [StampRewardTemplate] })
  findAll() {
    return this.stampService.findAllTemplates(false);
  }

  @Get('templates/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get a specific template' })
  @ApiOkResponse({ type: StampRewardTemplate })
  findOne(@Param('id') id: string) {
    return this.stampService.findTemplateOne(id);
  }

  @Patch('templates/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a template' })
  @ApiOkResponse({ type: StampRewardTemplate })
  update(@Param('id') id: string, @Body() dto: UpdateStampTemplateDto) {
    return this.stampService.updateTemplate(id, dto);
  }

  @Post('templates/:id/publish')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Publish a template so businesses can see it' })
  @ApiOkResponse({ type: StampRewardTemplate })
  publish(@Param('id') id: string) {
    return this.stampService.publishTemplate(id);
  }

  @Post('templates/:id/archive')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Archive a template' })
  @ApiOkResponse({ type: StampRewardTemplate })
  archive(@Param('id') id: string) {
    return this.stampService.archiveTemplate(id);
  }

  @Post('templates/:id/duplicate')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Duplicate a template' })
  @ApiOkResponse({ type: StampRewardTemplate })
  duplicate(@Param('id') id: string) {
    return this.stampService.duplicateTemplate(id);
  }

  @Delete('templates/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Soft delete a template' })
  remove(@Param('id') id: string) {
    return this.stampService.deleteTemplate(id);
  }
}
