
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal } from './entities/deal.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Deal')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiBody({
    type: CreateDealDto,
    examples: {
      a: {
        summary: 'Discount Deal',
        value: {
          title: 'Summer Sale',
          description: 'Get 20% off on all products',
          type: 'Discount',
          value: 20.0,
          startDate: '2024-07-20T00:00:00.000Z',
          endDate: '2024-08-20T00:00:00.000Z',
          audience: 'All',
          category: 'Electronics',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The deal has been successfully created.',
    type: Deal,
  })
  create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() business: Business,
  ): Promise<Deal> {
    return this.dealService.create(createDealDto, business);
  }

  @Get()
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Get all deals for the current business' })
  @ApiResponse({
    status: 200,
    description: 'A list of deals.',
    type: [Deal],
  })
  findAll(
    @CurrentUser() business: Business,
    @Query() paginationDto: PaginationDto,
  ): Promise<[Deal[], number]> {
    return this.dealService.findAll(business, paginationDto);
  }

  @Get(':id')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Get a specific deal' })
  @ApiResponse({ status: 200, description: 'The deal.', type: Deal })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() business: Business,
  ): Promise<Deal> {
    return this.dealService.findOne(id, business);
  }

  @Patch(':id')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Update a deal' })
  @ApiResponse({
    status: 200,
    description: 'The updated deal.',
    type: Deal,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() business: Business,
  ): Promise<Deal> {
    return this.dealService.update(id, updateDealDto, business);
  }

  @Delete(':id')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiResponse({
    status: 204,
    description: 'The deal has been successfully deleted.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() business: Business,
  ): Promise<void> {
    return this.dealService.remove(id, business);
  }

  @Patch(':id/activate')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Activate a deal' })
  @ApiResponse({
    status: 200,
    description: 'The activated deal.',
    type: Deal,
  })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() business: Business,
  ): Promise<Deal> {
    return this.dealService.activate(id, business);
  }

  @Patch(':id/deactivate')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Deactivate a deal' })
  @ApiResponse({
    status: 200,
    description: 'The deactivated deal.',
    type: Deal,
  })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() business: Business,
  ): Promise<Deal> {
    return this.dealService.deactivate(id, business);
  }
}
