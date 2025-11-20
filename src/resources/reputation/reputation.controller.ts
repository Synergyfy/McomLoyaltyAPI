import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReputationType } from './entities/reputation-type.enum';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ManualOverrideDto } from './dto/manual-override.dto';

@ApiTags('Reputation & Growth')
@Controller('reputation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('levels')
  @ApiOperation({ summary: 'Get all reputation levels' })
  @ApiQuery({ name: 'type', enum: ReputationType, required: false })
  findAllLevels(@Query('type') type?: ReputationType) {
    return this.reputationService.findAllLevels(type);
  }

  @Get('my-status')
  @ApiOperation({ summary: 'Get current status for the logged-in user' })
  getMyStatus(@CurrentUser() user: any) {
    // Determine type based on role
    let type: ReputationType;
    if (user.role === Role.Business) {
      type = ReputationType.BUSINESS;
    } else if (user.role === UserRole.PARTICIPANT) {
      type = ReputationType.PARTICIPANT;
    } else {
        // Admin or Staff viewing their own? Not applicable really, but handle gracefully
        return { message: 'Reputation not applicable for this role' };
    }
    return this.reputationService.getStatus(user.id, type);
  }

  @Get('my-history')
  @ApiOperation({ summary: 'Get history for the logged-in user' })
  getMyHistory(@CurrentUser() user: any) {
    let type: ReputationType;
    if (user.role === Role.Business) {
      type = ReputationType.BUSINESS;
    } else if (user.role === UserRole.PARTICIPANT) {
      type = ReputationType.PARTICIPANT;
    } else {
        return [];
    }
    return this.reputationService.getHistory(user.id, type);
  }

  // Admin Endpoints

  @Get('admin/business/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get reputation status of a business' })
  getBusinessStatus(@Param('id') id: string) {
    return this.reputationService.getStatus(id, ReputationType.BUSINESS);
  }

  @Get('admin/participant/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get reputation status of a participant' })
  getParticipantStatus(@Param('id') id: string) {
    return this.reputationService.getStatus(id, ReputationType.PARTICIPANT);
  }

  @Get('admin/business/:id/history')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get reputation history of a business' })
  getBusinessHistory(@Param('id') id: string) {
    return this.reputationService.getHistory(id, ReputationType.BUSINESS);
  }

  @Get('admin/participant/:id/history')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get reputation history of a participant' })
  getParticipantHistory(@Param('id') id: string) {
    return this.reputationService.getHistory(id, ReputationType.PARTICIPANT);
  }

  @Post('admin/override')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Manually override reputation level' })
  manualOverride(@Body() manualOverrideDto: ManualOverrideDto) {
    return this.reputationService.manualOverride(
      manualOverrideDto.userId,
      manualOverrideDto.userType,
      manualOverrideDto.levelId,
      manualOverrideDto.reason,
    );
  }
}
