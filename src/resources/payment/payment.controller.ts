import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe/initiate')
  initiateStripePayment(@Body() initiatePaymentDto: InitiatePaymentDto, @CurrentUser() user) {
    return this.paymentService.initiateStripePayment(initiatePaymentDto, user);
  }

  @Post('stripe/verify')
  verifyStripePayment(@Body() verifyPaymentDto: VerifyPaymentDto, @CurrentUser() user) {
    return this.paymentService.verifyStripePayment(verifyPaymentDto, user);
  }

  @Post('paypal/initiate')
  initiatePaypalPayment(@Body() initiatePaymentDto: InitiatePaymentDto, @CurrentUser() user) {
    return this.paymentService.initiatePaypalPayment(initiatePaymentDto, user);
  }

  @Post('paypal/verify')
  verifyPaypalPayment(@Body() verifyPaymentDto: VerifyPaymentDto, @CurrentUser() user) {
    return this.paymentService.verifyPaypalPayment(verifyPaymentDto, user);
  }
}
