
import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UseGuards } from '@nestjs/common';
import { SectorService } from '../services/sector.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../admin/auth/jwt-auth.guard';

@ApiTags('sectors')
@Controller('sectors')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, description: 'The sector has been successfully created.' })
  create(@Body(new ValidationPipe()) createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sectors' })
  findAll() {
    return this.sectorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sector by id' })
  findOne(@Param('id') id: string) {
    return this.sectorService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a sector' })
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateSectorDto: UpdateSectorDto) {
    return this.sectorService.update(id, updateSectorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sector' })
  remove(@Param('id') id: string) {
    return this.sectorService.remove(id);
  }
}
