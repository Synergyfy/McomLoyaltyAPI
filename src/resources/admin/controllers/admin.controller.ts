import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AtGuard } from 'src/common/guards';
import { AdminService } from '../services/admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Admin: Get all businesses' })
  @ApiResponse({ status: 200, description: 'Return all businesses.' })
  @UseGuards(AtGuard)
  @Get('businesses')
  async getBusinesses(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getBusinesses(page, limit);
  }

  @ApiOperation({ summary: 'Admin: Get all staffs by business ID' })
  @ApiResponse({ status: 200, description: 'Return all staffs for a business.' })
  @UseGuards(AtGuard)
  @Get('staffs/:businessId')
  async getStaffs(@Param('businessId') businessId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getStaffs(businessId, page, limit);
  }
}
