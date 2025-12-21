import { Controller, Get, UseGuards } from "@nestjs/common";
import { MembershipService } from "./membership.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Membership } from "./entities/membership.entity";
import { PaymentHistory } from "../payment-history/entities/payment-history.entity";
import { JoinTrialDto } from "./dto/join-trial.dto";
import { Post, Body } from "@nestjs/common";
import { SkipMembershipCheck } from "../../common/decorators/skip-membership-check.decorator";

@ApiTags("Membership")
@Controller("membership")
@UseGuards(JwtAuthGuard)
@SkipMembershipCheck()
@ApiBearerAuth()
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get("my-membership")
  @ApiOperation({ summary: "Get the current user's membership" })
  @ApiResponse({
    status: 200,
    description: "Return the current membership.",
    type: Membership,
  })
  @ApiResponse({ status: 404, description: "Membership not found." })
  getMyMembership(@CurrentUser() user) {
    return this.membershipService.getMyMembership(user);
  }

  @Get("my-payment-history")
  @ApiOperation({ summary: "Get the current user's payment history" })
  @ApiResponse({
    status: 200,
    description: "Return the payment history.",
    type: [PaymentHistory],
  })
  getMyPaymentHistory(@CurrentUser() user) {
    return this.membershipService.getMyPaymentHistory(user);
  }

  @Post("join-trial")
  @ApiOperation({ summary: "Join a tier with a trial membership" })
  @ApiResponse({
    status: 201,
    description: "Trial membership created.",
    type: Membership,
  })
  @ApiResponse({ status: 400, description: "Membership already exists." })
  joinTrial(@CurrentUser() user, @Body() joinTrialDto: JoinTrialDto) {
    return this.membershipService.joinTrial(user, joinTrialDto);
  }
}
