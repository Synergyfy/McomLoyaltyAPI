import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IpBlockService } from './ip-block.service';
import { CreateIpBlockDto } from './dto/create-ip-block.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin-Only')
@ApiBearerAuth()
@Controller('admin/ip-block')
@UseGuards(RolesGuard)
@Roles(Role.Admin)
export class IpBlockController {
  constructor(private readonly ipBlockService: IpBlockService) {}

  @Post()
  @ApiOperation({ summary: 'Block an IP address' })
  @ApiResponse({ status: 201, description: 'The IP has been successfully blocked.' })
  create(@Body() createIpBlockDto: CreateIpBlockDto) {
    return this.ipBlockService.create(createIpBlockDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blocked IPs' })
  @ApiResponse({ status: 200, description: 'Return all blocked IPs.' })
  findAll() {
    return this.ipBlockService.findAll();
  }

  @Delete(':ip')
  @ApiOperation({ summary: 'Unblock an IP address' })
  @ApiResponse({ status: 200, description: 'The IP has been successfully unblocked.' })
  remove(@Param('ip') ip: string) {
    return this.ipBlockService.remove(ip);
  }
}
