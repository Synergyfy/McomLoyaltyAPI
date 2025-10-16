import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../auth/auth.service';
import { Public } from '../../../common/decorators/public.decorator';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { CreateAdminDto } from '../dto/create-admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in as an admin' })
  @ApiResponse({ status: 200, description: 'Successfully logged in, returns access token.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'adminPassword123' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({ status: 201, description: 'The admin has been successfully created.' })
  @ApiBody({ type: CreateAdminDto })
  create(@Body(new ValidationPipe()) createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @ApiOperation({ summary: 'Admin: Get all businesses' })
  @ApiResponse({ status: 200, description: 'Return all businesses.' })
  @Get('businesses')
  async getBusinesses(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getBusinesses(page, limit);
  }

  @ApiOperation({ summary: 'Admin: Get all staffs by business ID' })
  @ApiResponse({ status: 200, description: 'Return all staffs for a business.' })
  @Get('staffs/:businessId')
  async getStaffs(@Param('businessId') businessId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getStaffs(businessId, page, limit);
  }
}
