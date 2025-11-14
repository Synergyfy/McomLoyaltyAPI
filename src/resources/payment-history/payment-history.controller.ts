import { Controller, Get, UseGuards } from '@nestjs/common';
import { PaymentHistoryService } from './payment-history.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentHistory } from './entities/payment-history.entity';

@ApiTags('Payment History')
@Controller('payment-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentHistoryController {
  constructor(private readonly paymentHistoryService: PaymentHistoryService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all payment history (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return all payment history.', type: [PaymentHistory] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.paymentHistoryService.findAll();
  }
}
