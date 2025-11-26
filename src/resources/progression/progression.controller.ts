import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ProgressionService } from './progression.service';
import { ProgressionEntityType } from './entities/progression-history.entity';
import { CreateBusinessLevelDto } from './dto/create-business-level.dto';
import { UpdateBusinessLevelDto } from './dto/update-business-level.dto';
import { CreateCustomerBadgeDto } from './dto/create-customer-badge.dto';
import { UpdateCustomerBadgeDto } from './dto/update-customer-badge.dto';

@ApiTags('Progression (Tiers & Badges)')
@Controller('progression')
export class ProgressionController {
    constructor(private readonly progressionService: ProgressionService) { }

    @Get('levels')
    @ApiOperation({ summary: 'Get all business levels' })
    getLevels() {
        return this.progressionService.getAllBusinessLevels();
    }

    @Get('badges')
    @ApiOperation({ summary: 'Get all customer badges' })
    getBadges() {
        return this.progressionService.getAllCustomerBadges();
    }

    @Get('business/:id')
    @ApiOperation({ summary: 'Get business progression status' })
    async getBusinessProgression(@Param('id') id: string) {
        // Also triggers a check to ensure it's up to date
        await this.progressionService.checkAndUpdateBusinessTier(id);
        return this.progressionService.getBusinessProgression(id);
    }

    @Get('customer/:id')
    @ApiOperation({ summary: 'Get customer progression status' })
    async getCustomerProgression(@Param('id') id: string) {
        // Also triggers a check
        await this.progressionService.checkAndUpdateCustomerBadge(id);
        return this.progressionService.getCustomerProgression(id);
    }

    @Get('history/business/:id')
    @ApiOperation({ summary: 'Get business progression history' })
    getBusinessHistory(@Param('id') id: string) {
        return this.progressionService.getHistory(ProgressionEntityType.BUSINESS, id);
    }

    @Get('history/customer/:id')
    @ApiOperation({ summary: 'Get customer progression history' })
    getCustomerHistory(@Param('id') id: string) {
        return this.progressionService.getHistory(ProgressionEntityType.CUSTOMER, id);
    }

    @Post('admin/override/business')
    @ApiOperation({ summary: 'Admin override for business tier' })
    @ApiBody({ schema: { properties: { businessId: { type: 'string' }, levelId: { type: 'string' }, adminId: { type: 'string' } } } })
    overrideBusiness(@Body() body: { businessId: string; levelId: string; adminId: string }) {
        return this.progressionService.overrideBusinessTier(body.businessId, body.levelId, body.adminId);
    }

    @Post('admin/override/customer')
    @ApiOperation({ summary: 'Admin override for customer badge' })
    @ApiBody({ schema: { properties: { participantId: { type: 'string' }, badgeId: { type: 'string' }, adminId: { type: 'string' } } } })
    overrideCustomer(@Body() body: { participantId: string; badgeId: string; adminId: string }) {
        return this.progressionService.overrideCustomerBadge(body.participantId, body.badgeId, body.adminId);
    }

    @Put('admin/levels/:id')
    @ApiOperation({ summary: 'Update business level criteria' })
    updateLevel(@Param('id') id: string, @Body() dto: UpdateBusinessLevelDto) {
        return this.progressionService.updateBusinessLevel(id, dto);
    }

    @Put('admin/badges/:id')
    @ApiOperation({ summary: 'Update customer badge criteria' })
    updateBadge(@Param('id') id: string, @Body() dto: UpdateCustomerBadgeDto) {
        return this.progressionService.updateCustomerBadge(id, dto);
    }

    @Delete('admin/levels/:id')
    @ApiOperation({ summary: 'Delete business level' })
    deleteLevel(@Param('id') id: string) {
        return this.progressionService.deleteBusinessLevel(id);
    }

    @Delete('admin/badges/:id')
    @ApiOperation({ summary: 'Delete customer badge' })
    deleteBadge(@Param('id') id: string) {
        return this.progressionService.deleteCustomerBadge(id);
    }

    @Post('admin/levels')
    @ApiOperation({ summary: 'Create a new business level' })
    createLevel(@Body() dto: CreateBusinessLevelDto) {
        return this.progressionService.createBusinessLevel(dto);
    }

    @Post('admin/badges')
    @ApiOperation({ summary: 'Create a new customer badge' })
    createBadge(@Body() dto: CreateCustomerBadgeDto) {
        return this.progressionService.createCustomerBadge(dto);
    }
}
