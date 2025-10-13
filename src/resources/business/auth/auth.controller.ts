
import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Business Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in as a business' })
  @ApiResponse({ status: 200, description: 'Successfully logged in, returns access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'contact@gourmetkitchen.com' },
        password: { type: 'string', example: 'aStrongPassword123!' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh an access token for a business' })
  @ApiResponse({ status: 200, description: 'Successfully refreshed token, returns new access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
      required: ['refresh_token'],
    },
  })
  async refresh(@Request() req) {
    return this.authService.login(req.user);
  }
}
