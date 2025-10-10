
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new business profile' })
  @ApiResponse({ status: 201, description: 'The business profile has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async signup(@Body(new ValidationPipe()) createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }
}
