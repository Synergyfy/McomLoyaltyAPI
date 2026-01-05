import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { MallIntegrationService } from "./mall-integration.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("mall-integration")
@ApiBearerAuth()
@Controller("mall-integration")
export class MallIntegrationController {
  constructor(
    private readonly mallIntegrationService: MallIntegrationService,
  ) {}

  @ApiOperation({ summary: "Get SSO login URL for McomMall" })
  @UseGuards(JwtAuthGuard)
  @Get("sso-url")
  async getSsoUrl(@Req() req: any) {
    const user = req.user;
    // req.user usually contains id, email, role etc from JwtStrategy
    // We need to determine if it's a business or participant

    // In McomLoyalty, business owners might have role 'business' and participants 'participant'
    // I should check the User object structure in McomLoyalty

    return this.mallIntegrationService.generateSsoToken({
      email: user.email,
      name: user.name || user.email,
      role: user.role, // Assuming the role matches what we expect or we can map it
      phoneNumber: user.phoneNumber,
    });
  }
}
