import { Controller, Get, Post, Body, UseGuards, Request, Param } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Wallet")
@Controller("wallet")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get("my-balance")
  @Roles(Role.Business)
  async getMyBalance(@Request() req) {
    // Assuming req.user.businessId exists or we fetch it from user
    // Depending on Auth strategy, might need to look up business via User
    // For now assuming req.user.id is linked or we have businessId in payload
    return this.walletService.getWallet(req.user.businessId);
  }

  // Admin endpoint to manually top up (for testing or manual ops)
  @Post("admin/allocate/:businessId")
  @Roles(Role.Admin)
  async allocateFunds(
    @Param("businessId") businessId: string,
    @Body("amount") amount: number
  ) {
    return this.walletService.addTierAllocation(businessId, amount);
  }
}
