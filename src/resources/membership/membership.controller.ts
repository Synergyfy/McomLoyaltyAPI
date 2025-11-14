import { Controller, Get, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Membership')
@Controller('membership')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('my-membership')
  getMyMembership(@CurrentUser() user) {
    return this.membershipService.getMyMembership(user);
  }

  @Get('my-payment-history')
  getMyPaymentHistory(@CurrentUser() user) {
    return this.membershipService.getMyPaymentHistory(user);
  }
}
