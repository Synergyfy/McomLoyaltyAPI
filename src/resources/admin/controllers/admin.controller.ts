import { Controller, Get, Post, Body, Param, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({ status: 201, description: 'The admin has been successfully created.' })
  @ApiBody({ type: CreateAdminDto })
  create(@Body(new ValidationPipe()) createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get all businesses' })
  @ApiResponse({ status: 200, description: 'Return all businesses.' })
  @Get('businesses')
  async getBusinesses(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getBusinesses(page, limit);
  }

  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Admin: Get all staffs by business ID' })
  @ApiResponse({ status: 200, description: 'Return all staffs for a business.' })
  @Get('staffs/:businessId')
  async getStaffs(@Param('businessId') businessId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getStaffs(businessId, page, limit);
  }
}