import { Controller, Post, Body, ValidationPipe, Get, Patch, Delete, Request, UseGuards } from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';

@ApiTags('Business Lifecycle')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new business profile' })
  @ApiResponse({ status: 201, description: 'The business profile has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or email/name already exists.' })
  @ApiBody({ type: CreateBusinessDto })
  async signup(@Body(new ValidationPipe()) createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Roles(Role.Business)
  @Get('profile')
  @ApiOperation({ summary: 'Get business profile' })
  @ApiResponse({ status: 200, description: 'Return business profile.' })
  async getProfile(@Request() req) {
    return this.businessService.findById(req.user.id);
  }

  @Roles(Role.Business)
  @Patch('profile')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'The business profile has been successfully updated.' })
  @ApiBody({ type: UpdateBusinessDto })
  async updateProfile(@Request() req, @Body(new ValidationPipe()) updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(req.user.id, updateBusinessDto);
  }

  @Roles(Role.Business)
  @Delete('profile')
  @ApiOperation({ summary: 'Delete business profile' })
  @ApiResponse({ status: 200, description: 'The business profile has been successfully deleted.' })
  async deleteProfile(@Request() req) {
    return this.businessService.delete(req.user.id);
  }
}