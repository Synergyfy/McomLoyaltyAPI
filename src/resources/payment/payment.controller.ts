import { Controller, Post, Body, UseGuards, Headers, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { SubscribeDto } from './dto/subscribe.dto';
import { Business } from '../business/entities/business.entity';
import { Public } from '../../common/decorators/public.decorator';
import { RawBody } from '../../common/decorators/raw-body.decorator';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe/initiate')
  @ApiOperation({ summary: 'Initiate a payment with Stripe' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({ status: 201, description: 'The payment has been successfully initiated.', schema: { example: { clientSecret: 'pi_123abc...' } } })
  @ApiResponse({ status: 404, description: 'Tier not found.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired coupon code.' })
  initiateStripePayment(@Body() initiatePaymentDto: InitiatePaymentDto, @CurrentUser() user) {
    return this.paymentService.initiateStripePayment(initiatePaymentDto, user);
  }

  @Post('stripe/verify')
  @ApiOperation({ summary: 'Verify a payment with Stripe' })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({ status: 201, description: 'The payment has been successfully verified.', schema: { example: { status: 'succeeded' } } })
  verifyStripePayment(@Body() verifyPaymentDto: VerifyPaymentDto, @CurrentUser() user) {
    return this.paymentService.verifyStripePayment(verifyPaymentDto, user);
  }

  @Post('paypal/initiate')
  @ApiOperation({ summary: 'Initiate a payment with PayPal' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({ status: 201, description: 'The payment has been successfully initiated.', schema: { example: { orderId: '...' } } })
  @ApiResponse({ status: 404, description: 'Tier not found.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired coupon code.' })
  initiatePaypalPayment(@Body() initiatePaymentDto: InitiatePaymentDto, @CurrentUser() user) {
    return this.paymentService.initiatePaypalPayment(initiatePaymentDto, user);
  }

  @Post('paypal/verify')
  @ApiOperation({ summary: 'Verify a payment with PayPal' })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({ status: 201, description: 'The payment has been successfully verified.', schema: { example: { status: 'COMPLETED' } } })
  verifyPaypalPayment(@Body() verifyPaymentDto: VerifyPaymentDto, @CurrentUser() user) {
    return this.paymentService.verifyPaypalPayment(verifyPaymentDto, user);
  }

  @Post('subscribe')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Subscribe to a tier (Business only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully.' })
  subscribe(@Body() subscribeDto: SubscribeDto, @CurrentUser() business: Business) {
    return this.paymentService.subscribe(subscribeDto, business);
  }

  @Post('stripe-webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully.' })
  async stripeWebhook(@Headers('stripe-signature') signature: string, @RawBody() rawBody: Buffer) {
    return this.paymentService.handleStripeWebhook(signature, rawBody);
  }
}
