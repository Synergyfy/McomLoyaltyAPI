import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LocalAuthGuard } from "./local-auth.guard";
import { PartnerLocalAuthGuard } from "./partner-local-auth.guard";
import { Public } from "../common/decorators/public.decorator";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../common/role.enum";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../common/interfaces/user.interface";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description:
      "The user (Admin, Business, Staff, Participant) has been successfully logged in.",
    schema: {
      example: {
        user: {
          name: "John Doe",
          role: "Admin | Business | Staff | Participant",
          isOnboarded: true,
        },
        access_token: "your_access_token",
        refresh_token: "your_refresh_token",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @UseGuards(PartnerLocalAuthGuard)
  @Post("login/partner")
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: "The partner has been successfully logged in.",
    schema: {
      example: {
        user: {
          name: "Partner Name",
          role: "Partner",
        },
        access_token: "your_access_token",
        refresh_token: "your_refresh_token",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async loginPartner(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.loginPartner(req.user);
  }

  @Public()
  @Post("login/network")
  @ApiOperation({ summary: "Login for Network Contacts" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        identifier: { type: "string", example: "john@example.com" },
        password: { type: "string", example: "pass123" },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Network user logged in successfully.",
    schema: {
      example: {
        user: {
          name: "John Doe",
          role: "Network",
          email: "john@example.com",
          isEmailVerified: true,
        },
        access_token: "ey...",
        refresh_token: "ey...",
      },
    },
  })
  async loginNetwork(@Body() body: any) {
    // Handling if client sends 'email' instead of 'identifier' for backward compat or 'identifier'
    const identifier = body.identifier || body.email;
    const user = await this.authService.validateNetworkUser(
      identifier,
      body.password,
    );
    return this.authService.loginNetworkUser(user);
  }

  @Public()
  @Post("forgot-password")
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: "OTP sent successfully." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post("reset-password")
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: "Password reset successfully." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post("refresh-token")
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 201,
    description: "The token has been successfully refreshed.",
    schema: {
      example: {
        user: {
          name: "John Doe",
          role: "Admin",
        },
        access_token: "your_new_access_token",
        refresh_token: "your_new_refresh_token",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get("unique-code")
  @ApiBearerAuth()
  @Roles(Role.Business, Role.Staff, Role.Participant)
  @ApiOperation({
    summary: "Get the unique code for the current user",
    description: "Accessible by Business, Staff, and Participant users.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the unique code for the current user.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  getUniqueCode(
    @CurrentUser() currentUser: User,
  ): Promise<{ uniqueCode: string }> {
    return this.authService.getUniqueCode(currentUser);
  }

  @Public()
  @Post("verify-email")
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully.",
    schema: {
      example: {
        message: "Email verified successfully",
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid OTP or User not found." })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.otp,
    );
  }

  @Post("resend-otp")
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully or Account already verified.",
  })
  @ApiResponse({ status: 401, description: "User not found." })
  async resendOtp(@CurrentUser() user: User) {
    if (!user.email) {
      throw new UnauthorizedException("User email not found");
    }
    return this.authService.resendVerificationOtp(user.email);
  }

  @Public()
  @Post("network/setup/request")
  @ApiOperation({
    summary: "Request OTP to setup network login",
    description:
      "Public endpoint. Checks if identifier (email or phone) exists. If phone and no email on file, requires 'email' field to set up.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          example: "contact@example.com or +1234567890",
        },
        email: {
          type: "string",
          example: "new@example.com (Required if phone login with no email)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "OTP sent successfully." })
  async requestNetworkSetup(@Body() body: any) {
    return this.authService.requestNetworkSetup(body.identifier, body.email);
  }

  @Public()
  @Post("network/setup/complete")
  @ApiOperation({
    summary: "Verify OTP and set password for network login",
    description:
      "Public endpoint. Verifies OTP, sets password, and ensures email is set/verified.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          example: "contact@example.com or +1234567890",
        },
        email: { type: "string", example: "new@example.com" },
        otp: { type: "string", example: "123456" },
        password: { type: "string", example: "newPassword123" },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Setup complete and logged in.",
    schema: {
      example: {
        user: { role: "Network" },
        access_token: "...",
        refresh_token: "...",
      },
    },
  })
  async completeNetworkSetup(@Body() dto: any) {
    return this.authService.completeNetworkSetup(dto);
  }

  @Public()
  @Post("sso")
  @ApiOperation({ summary: "Login via SSO token" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "SSO failed" })
  async ssoLogin(@Body("token") token: string) {
    return this.authService.ssoLogin(token);
  }
}
