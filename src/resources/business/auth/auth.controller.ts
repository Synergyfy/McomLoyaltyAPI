
import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Business Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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
