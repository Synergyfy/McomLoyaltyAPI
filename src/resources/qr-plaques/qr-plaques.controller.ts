import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Delete, Query } from '@nestjs/common';
import { QrPlaquesService } from './qr-plaques.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateQrPlaqueDto } from './dto/update-qr-plaque.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GrowthActivityChartDto } from '../analytics/dto/growth-activity-chart.dto';

@ApiTags('QR Plaques')
@Controller('qr-plaques')
export class QrPlaquesController {
    constructor(private readonly qrPlaquesService: QrPlaquesService) { }

    @Get('admin/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get QR plaque statistics (Admin only)' })
    async getAdminStats() {
        return this.qrPlaquesService.getAdminStats();
    }

    @Get('admin/analytics/chart')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get QR plaque scan chart data (Admin only)' })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    async getChartData(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.qrPlaquesService.getChartData(startDate, endDate);
    }

    @Get('admin/analytics/top-performing')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get top 10 performing QR plaques (Admin only)' })
    async getTopPerforming(@Query() query: GrowthActivityChartDto) {
        return this.qrPlaquesService.getTopPerformingPlaques(query);
    }

    @Get('admin/all')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all QR plaques (Admin only)' })
    async findAllAdmin(@Query() paginationDto: PaginationDto) {
        return this.qrPlaquesService.findAllAdmin(paginationDto);
    }

    @Patch('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a QR plaque (Admin only)' })
    async update(@Param('id') id: string, @Body() updateQrPlaqueDto: UpdateQrPlaqueDto) {
        return this.qrPlaquesService.update(id, updateQrPlaqueDto);
    }

    @Delete('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a QR plaque (Admin only)' })
    async remove(@Param('id') id: string) {
        return this.qrPlaquesService.remove(id);
    }

    @Public()
    @Get('scan/:code')
    @ApiOperation({ summary: 'Scan a QR plaque and get the link' })
    async scanPlaque(@Param('code') code: string) {
        return this.qrPlaquesService.scanPlaque(code);
    }

    @Get('business')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all QR plaques for the current business' })
    async findAllForBusiness(@Req() req) {
        return this.qrPlaquesService.findAllForBusiness(req.user.id);
    }

    @Get(':code')
    @ApiOperation({ summary: 'Get a QR plaque by its code' })
    async findOne(@Param('code') code: string) {
        return this.qrPlaquesService.findOneByCode(code);
    }

    @Post(':id/invite')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Invite a user to claim a plaque' })
    async inviteUser(@Param('id') id: string, @Body('email') email: string) {
        return this.qrPlaquesService.inviteUser(id, email);
    }

    @Post('verify-invite')
    @ApiOperation({ summary: 'Verify an invite code and claim plaque' })
    async verifyInvite(@Body('code') code: string, @Body('email') email: string) {
        return this.qrPlaquesService.verifyInvite(code, email);
    }
}
