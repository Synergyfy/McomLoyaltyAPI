import { Controller, Get, UseGuards } from '@nestjs/common';
import { PaymentHistoryService } from './payment-history.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Payment History')
@Controller('payment-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentHistoryController {
  constructor(private readonly paymentHistoryService: PaymentHistoryService) {}

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.paymentHistoryService.findAll();
  }
}
