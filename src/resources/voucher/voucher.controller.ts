import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherFilterDto } from './dto/voucher-filter.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/common/interfaces/user.interface';

@ApiTags('vouchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Create a new voucher' })
  @ApiResponse({
    status: 201,
    description: 'The voucher has been successfully created.',
  })
  create(@Body() createVoucherDto: CreateVoucherDto, @CurrentUser() user: User) {
    return this.voucherService.create(createVoucherDto, user);
  }

  @Get()
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'List all vouchers for the current user' })
  @ApiResponse({ status: 200, description: 'Return all vouchers.' })
  findAll(@CurrentUser() user: User, @Query() filterDto: VoucherFilterDto) {
    return this.voucherService.findAll(user, filterDto);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Get a voucher by ID' })
  @ApiResponse({ status: 200, description: 'Return the voucher.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.voucherService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Update a voucher' })
  @ApiResponse({
    status: 200,
    description: 'The voucher has been successfully updated.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @CurrentUser() user: User,
  ) {
    return this.voucherService.update(id, updateVoucherDto, user);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: 'Delete a voucher' })
  @ApiResponse({
    status: 200,
    description: 'The voucher has been successfully deleted.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.voucherService.remove(id, user);
  }

  @Post(':id/redeem')
  @Roles(Role.Participant) // Assuming a participant role for redemption
  @ApiOperation({ summary: 'Redeem a voucher' })
  @ApiResponse({ status: 200, description: 'Voucher redeemed successfully.' })
  redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body('campaignId') campaignId: string, // Assuming campaignId is provided in the body
  ) {
    return this.voucherService.redeem(id, user.id, campaignId);
  }
}
