import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { PaymentHistoryService } from "./payment-history.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PaymentHistory } from "./entities/payment-history.entity";
import { PaymentHistoryQueryDto } from "./dto/payment-history-query.dto";
import { PaginatedPaymentHistoryResponseDto } from "./dto/paginated-payment-history-response.dto";

@ApiTags("Payment History")
@Controller("payment-history")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentHistoryController {
  constructor(private readonly paymentHistoryService: PaymentHistoryService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get all payment history (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Return all payment history.",
    type: PaginatedPaymentHistoryResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findAll(@Query() query: PaymentHistoryQueryDto) {
    return this.paymentHistoryService.findAll(query);
  }
}
