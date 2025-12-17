import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { QrPlaquesService } from './qr-plaques.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CreateQrPlaqueDto } from './dto/create-qr-plaque.dto';
import { UpdateQrPlaqueDto } from './dto/update-qr-plaque.dto';
import { QrPlaqueQueryDto } from './dto/qr-plaque-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GrowthActivityChartDto } from '../analytics/dto/growth-activity-chart.dto';
import { QrPlaque } from './entities/qr-plaque.entity';

@ApiTags('QR Plaques')
@Controller('qr-plaques')
export class QrPlaquesController {
    constructor(private readonly qrPlaquesService: QrPlaquesService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new QR Plaque (Business only)' })
    @ApiBody({ type: CreateQrPlaqueDto })
    @ApiResponse({ status: 201, description: 'The plaque has been successfully created.', type: QrPlaque })
    async create(@Req() req, @Body() createQrPlaqueDto: CreateQrPlaqueDto) {
        return this.qrPlaquesService.create(createQrPlaqueDto, req.user.id);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all plaques for the current business with filtering' })
    async findAllBusiness(@Req() req, @Query() query: QrPlaqueQueryDto) {
        return this.qrPlaquesService.findAllBusiness(req.user.id, query);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update/Assign a plaque (Business only)' })
    @ApiParam({ name: 'id', description: 'Plaque ID' })
    @ApiBody({ type: UpdateQrPlaqueDto })
    async update(@Req() req, @Param('id') id: string, @Body() updateDto: UpdateQrPlaqueDto) {
        // Ownership check
        const plaque = await this.qrPlaquesService.findOne(id);
        if (!plaque.assignedBusiness || plaque.assignedBusiness.id !== req.user.id) {
            throw new UnauthorizedException('You do not own this plaque');
        }
        return this.qrPlaquesService.update(id, updateDto);
    }

    // Admin Endpoints

    @Get('admin/list')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all QR plaques (Admin only)' })
    async findAllAdmin(@Query() query: QrPlaqueQueryDto) {
        return this.qrPlaquesService.findAllAdmin(query);
    }

    @Patch('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a QR plaque, e.g. upload QR code URL (Admin only)' })
    @ApiBody({ type: UpdateQrPlaqueDto })
    async updateAdmin(@Param('id') id: string, @Body() updateDto: UpdateQrPlaqueDto) {
        return this.qrPlaquesService.update(id, updateDto);
    }

    @Delete('admin/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a QR plaque (Admin only)' })
    async remove(@Param('id') id: string) {
        return this.qrPlaquesService.remove(id);
    }

    // Stats & Analytics

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

    // Public/Shared

    @Public()
    @Get('scan/:code')
    @ApiOperation({ summary: 'Scan a QR plaque and get the content URL' })
    async scanPlaque(@Param('code') code: string) {
        return this.qrPlaquesService.scanPlaque(code);
    }

    @Public()
    @Get(':code')
    @ApiOperation({ summary: 'Get a QR plaque by its code' })
    async findOneByCode(@Param('code') code: string) {
        return this.qrPlaquesService.findOneByCode(code);
    }
}
