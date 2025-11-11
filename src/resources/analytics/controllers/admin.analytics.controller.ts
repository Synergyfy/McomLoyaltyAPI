import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { PointHistoryService } from '../services/point-history.service';
import { PointLogFilterDto } from '../dto/point-log-filter.dto';
import { PointHistory } from '../../participant-campaign-balance/entities/point-history.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly pointHistoryService: PointHistoryService) {}

  @Get('point-logs')
  @ApiOperation({ summary: 'Get all point logs (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of all point logs.',
    type: [PointHistory],
  })
  async getPointLogs(@Query() filterDto: PointLogFilterDto) {
    return this.pointHistoryService.findAll(filterDto);
  }
}
