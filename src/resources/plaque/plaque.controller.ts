import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Get,
  Query,
} from '@nestjs/common';
import { PlaqueService } from './plaque.service';
import { CreateScanEventDto } from './dto/create-scan-event.dto';
import { AssignPlaqueDto } from './dto/assign-plaque.dto';
import { TransferPlaqueDto } from './dto/transfer-plaque.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { CreatePlaqueDto } from './dto/create-plaque.dto';
import { MarkForSaleDto } from './dto/mark-for-sale.dto';

@Controller('plaques')
export class PlaqueController {
  constructor(private readonly plaqueService: PlaqueService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPlaqueDto: CreatePlaqueDto,
    @CurrentUser() user: User,
  ) {
    return this.plaqueService.createPlaque(createPlaqueDto, user.id);
  }

  @Get(':id/scan')
  @Public()
  scan(@Param('id', ParseUUIDPipe) id: string, @Query() query: any) {
    const createScanEventDto: CreateScanEventDto = {
      plaque_id: id,
      ...query,
    };
    return this.plaqueService.createScanEvent(createScanEventDto);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard)
  assignPlaque(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPlaqueDto: AssignPlaqueDto,
    @CurrentUser() user: User,
  ) {
    return this.plaqueService.assignPlaque(id, assignPlaqueDto, user.id);
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  transferPlaque(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() transferPlaqueDto: TransferPlaqueDto,
    @CurrentUser() user: User,
  ) {
    return this.plaqueService.transferPlaque(id, transferPlaqueDto, user.id);
  }

  @Post(':id/mark-for-sale')
  @UseGuards(JwtAuthGuard)
  markForSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markForSaleDto: MarkForSaleDto,
    @CurrentUser() user: User,
  ) {
    return this.plaqueService.markForSale(id, markForSaleDto, user.id);
  }
}
