import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { PartnerLocalAuthGuard } from './partner-local-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'The user (Admin, Business, Staff, Participant) has been successfully logged in.',
    schema: {
      example: {
        user: {
          name: 'John Doe',
          role: 'Admin | Business | Staff | Participant',
          isOnboarded: true,
        },
        access_token: 'your_access_token',
        refresh_token: 'your_refresh_token',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @UseGuards(PartnerLocalAuthGuard)
  @Post('login/partner')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'The partner has been successfully logged in.',
    schema: {
      example: {
        user: {
          name: 'Partner Name',
          role: 'Partner',
        },
        access_token: 'your_access_token',
        refresh_token: 'your_refresh_token',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async loginPartner(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.loginPartner(req.user);
  }

  @Public()
  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('refresh-token')
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 201,
    description: 'The token has been successfully refreshed.',
    schema: {
      example: {
        user: {
          name: 'John Doe',
          role: 'Admin',
        },
        access_token: 'your_new_access_token',
        refresh_token: 'your_new_refresh_token',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}