import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ParticipantProgressionService } from './participant-progression.service';
import { CreateParticipantBadgeDto } from './dto/create-participant-badge.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { ParticipantBadge } from './entities/participant-badge.entity';

@ApiTags('Participant Progression')
@Controller('participant-progression')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParticipantProgressionController {
    constructor(private readonly progressionService: ParticipantProgressionService) { }

    @Post('badges')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create a new badge level (Admin only)' })
    @ApiResponse({ type: ParticipantBadge })
    async createBadge(@Body() dto: CreateParticipantBadgeDto) {
        return this.progressionService.createBadge(dto);
    }

    @Get('badges')
    @Roles(Role.Admin, Role.Business)
    @ApiOperation({ summary: 'Get all badge levels' })
    @ApiResponse({ type: [ParticipantBadge] })
    async getBadges() {
        return this.progressionService.getBadges();
    }
}
