import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TierService } from './tier.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tier')
@Controller('tier')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TierController {
  constructor(private readonly tierService: TierService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createTierDto: CreateTierDto) {
    return this.tierService.create(createTierDto);
  }

  @Get()
  findAll() {
    return this.tierService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tierService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateTierDto: UpdateTierDto) {
    return this.tierService.update(id, updateTierDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.tierService.remove(id);
  }
}
