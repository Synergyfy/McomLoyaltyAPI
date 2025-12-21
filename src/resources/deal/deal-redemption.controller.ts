import { Controller, Post, Body, UseGuards, Get } from "@nestjs/common";
import { DealRedemptionService } from "./deal-redemption.service";
import { PurchaseDealDto } from "./dto/purchase-deal.dto";
import { RedeemDealDto } from "./dto/redeem-deal.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../common/interfaces/user.interface";

@ApiTags("Deal Redemptions")
@ApiBearerAuth()
@Controller("deal-redemptions")
export class DealRedemptionController {
  constructor(private readonly redemptionService: DealRedemptionService) {}

  @Post("purchase")
  @Roles(Role.Participant)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "Purchase a deal" })
  @ApiResponse({ status: 201, description: "Deal purchased successfully." })
  @ApiResponse({
    status: 400,
    description: "Bad Request (e.g. inventory limit).",
  })
  purchase(
    @Body() purchaseDealDto: PurchaseDealDto,
    @CurrentUser() user: User,
  ) {
    return this.redemptionService.purchase(purchaseDealDto, user);
  }

  @Post("claim")
  @Roles(Role.Participant)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "Claim a reward deal with points" })
  @ApiResponse({ status: 201, description: "Reward claimed successfully." })
  @ApiResponse({
    status: 400,
    description: "Insufficient points or invalid deal.",
  })
  claim(@Body() purchaseDealDto: PurchaseDealDto, @CurrentUser() user: User) {
    return this.redemptionService.claimReward(purchaseDealDto.dealId, user);
  }

  @Post("redeem")
  @Roles(Role.Business, Role.Admin)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "Redeem a deal voucher (Business scan)" })
  @ApiResponse({ status: 200, description: "Voucher redeemed successfully." })
  @ApiResponse({ status: 400, description: "Invalid code or unauthorized." })
  redeem(@Body() redeemDealDto: RedeemDealDto, @CurrentUser() user: User) {
    return this.redemptionService.redeem(redeemDealDto.redemptionCode, user);
  }

  @Get("my-redemptions")
  @Roles(Role.Participant)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "Get my purchased deals/redemptions" })
  @ApiResponse({ status: 200, description: "List of redemptions." })
  getMyRedemptions(@CurrentUser() user: User) {
    return this.redemptionService.getMyRedemptions(user);
  }
}
