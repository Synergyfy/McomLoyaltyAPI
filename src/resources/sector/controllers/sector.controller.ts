
import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { SectorService } from '../services/sector.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { UpdateSectorDto } from '../dto/update-sector.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('sectors')
@Controller('sectors')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({ status: 201, description: 'The sector has been successfully created.' })
  create(@Body(new ValidationPipe()) createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all sectors' })
  findAll() {
    return this.sectorService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a sector by id' })
  findOne(@Param('id') id: string) {
    return this.sectorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sector' })
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateSectorDto: UpdateSectorDto) {
    return this.sectorService.update(id, updateSectorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sector' })
  remove(@Param('id') id: string) {
    return this.sectorService.remove(id);
  }
}
