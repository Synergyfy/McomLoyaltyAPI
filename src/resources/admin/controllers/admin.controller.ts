
import { Controller, Post, Body, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { AuthService } from '../auth/auth.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Admin Authentication')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new admin user (for setup purposes)' })
  @ApiResponse({ status: 201, description: 'The admin user has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: CreateAdminDto })
  async signup(@Body(new ValidationPipe()) createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in as an admin' })
  @ApiResponse({ status: 200, description: 'Successfully logged in, returns access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'strongPassword123!' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
