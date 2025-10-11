
import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../business/auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly authService: AuthService,
    ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in as a staff member' })
  @ApiResponse({ status: 200, description: 'Successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({ status: 201, description: 'The staff member has been successfully created.' })
  create(@Body(new ValidationPipe()) createStaffDto: CreateStaffDto, @Request() req) {
    return this.staffService.create(createStaffDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all staff members for the business' })
  findAll(@Request() req) {
    return this.staffService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by id' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.staffService.findOne(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateStaffDto: UpdateStaffDto, @Request() req) {
    return this.staffService.update(id, updateStaffDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member' })
  remove(@Param('id') id: string, @Request() req) {
    return this.staffService.remove(id, req.user.id);
  }
}
