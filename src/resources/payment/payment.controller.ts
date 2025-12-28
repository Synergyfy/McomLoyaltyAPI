import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  Req,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";
import { InitiateWalletTopupDto } from "./dto/initiate-wallet-topup.dto";
import { VerifyWalletTopupDto } from "./dto/verify-wallet-topup.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { SubscribeDto } from "./dto/subscribe.dto";
import { Business } from "../business/entities/business.entity";
import { Public } from "../../common/decorators/public.decorator";
import { RawBody } from "../../common/decorators/raw-body.decorator";
import { VerifySubscriptionDto } from "./dto/verify-subscription.dto";
import { SkipMembershipCheck } from "../../common/decorators/skip-membership-check.decorator";
import { AuthService } from "../../auth/auth.service";
import { UserService } from "../../user/user.service";

@ApiTags("Payment")
@Controller("payment")
@UseGuards(JwtAuthGuard)
@SkipMembershipCheck()
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post("stripe/initiate")
  @ApiOperation({ summary: "Initiate a payment with Stripe" })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: "The payment has been successfully initiated.",
    schema: { example: { clientSecret: "pi_123abc..." } },
  })
  @ApiResponse({ status: 404, description: "Tier not found." })
  @ApiResponse({ status: 400, description: "Invalid or expired coupon code." })
  initiateStripePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @CurrentUser() user,
  ) {
    return this.paymentService.initiateStripePayment(initiatePaymentDto, user);
  }

  @Post("stripe/verify")
  @ApiOperation({ summary: "Verify a payment with Stripe" })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({
    status: 201,
    description: "The payment has been successfully verified.",
    schema: { example: { status: "succeeded" } },
  })
  async verifyStripePayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @CurrentUser() user,
  ) {
    const result = await this.paymentService.verifyStripePayment(
      verifyPaymentDto,
      user,
    );
    if (result.status === "succeeded") {
      const fullUser = await this.userService.findOne(user.email);
      const tokens = await this.authService.login(fullUser);
      return { ...result, ...tokens };
    }
    return result;
  }

  @Post("paypal/initiate")
  @ApiOperation({ summary: "Initiate a payment with PayPal" })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: "The payment has been successfully initiated.",
    schema: { example: { orderId: "..." } },
  })
  @ApiResponse({ status: 404, description: "Tier not found." })
  @ApiResponse({ status: 400, description: "Invalid or expired coupon code." })
  initiatePaypalPayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @CurrentUser() user,
  ) {
    return this.paymentService.initiatePaypalPayment(initiatePaymentDto, user);
  }

  @Post("paypal/verify")
  @ApiOperation({ summary: "Verify a payment with PayPal" })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({
    status: 201,
    description: "The payment has been successfully verified.",
    schema: { example: { status: "COMPLETED" } },
  })
  async verifyPaypalPayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @CurrentUser() user,
  ) {
    const result = await this.paymentService.verifyPaypalPayment(
      verifyPaymentDto,
      user,
    );
    if (result.status === "COMPLETED") {
      const fullUser = await this.userService.findOne(user.email);
      const tokens = await this.authService.login(fullUser);
      return { ...result, ...tokens };
    }
    return result;
  }

  @Post("paypal/verify-subscription")
  @ApiOperation({ summary: "Verify a PayPal subscription" })
  @ApiBody({ type: VerifySubscriptionDto })
  @ApiResponse({
    status: 201,
    description: "The subscription has been successfully verified.",
    schema: { example: { status: "ACTIVE" } },
  })
  async verifyPaypalSubscription(
    @Body() verifySubscriptionDto: VerifySubscriptionDto,
    @CurrentUser() user,
  ) {
    const result = await this.paymentService.verifyPaypalSubscription(
      verifySubscriptionDto,
      user,
    );
    if (result.status === "ACTIVE") {
      const fullUser = await this.userService.findOne(user.email);
      const tokens = await this.authService.login(fullUser);
      return { ...result, ...tokens };
    }
    return result;
  }

  @Post("subscribe")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Subscribe to a tier (Business only)" })
  @ApiResponse({
    status: 201,
    description: "Subscription created successfully.",
  })
  async subscribe(
    @Body() subscribeDto: SubscribeDto,
    @CurrentUser() business: Business,
  ) {
    const result = await this.paymentService.subscribe(subscribeDto, business);
    // If trial started immediately without payment verification needed, or if subscription successful (e.g. valid immediate charge)
    if (
      result.status === "Trial started" ||
      result.status === "Subscription successful"
    ) {
      const fullUser = await this.userService.findOne(business.email);
      const tokens = await this.authService.login(fullUser);
      return { ...result, ...tokens };
    }
    return result;
  }

  @Post("stripe-webhook")
  @Public()
  @ApiOperation({ summary: "Stripe webhook endpoint" })
  @ApiResponse({ status: 200, description: "Webhook received successfully." })
  async stripeWebhook(
    @Headers("stripe-signature") signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    return this.paymentService.handleStripeWebhook(signature, rawBody);
  }

  @Post("wallet/initiate")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Initiate a wallet top-up" })
  @ApiBody({ type: InitiateWalletTopupDto })
  @ApiResponse({
    status: 201,
    description: "Top-up initiated successfully.",
  })
  async initiateWalletTopup(
    @Body() dto: InitiateWalletTopupDto,
    @CurrentUser() user,
  ) {
    return this.paymentService.initiateWalletTopup(
      user,
      dto.amount,
      dto.provider,
    );
  }

  @Post("wallet/verify")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Verify a wallet top-up" })
  @ApiBody({ type: VerifyWalletTopupDto })
  @ApiResponse({
    status: 201,
    description: "Top-up verified successfully.",
  })
  async verifyWalletTopup(
    @Body() dto: VerifyWalletTopupDto,
    @CurrentUser() user,
  ) {
    return this.paymentService.verifyWalletTopup(
      user,
      dto.transaction_id,
      dto.provider,
    );
  }
}
