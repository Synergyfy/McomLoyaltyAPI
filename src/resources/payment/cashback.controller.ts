import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CentralIntegrationService } from './central-integration.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipMembershipCheck } from '../../common/decorators/skip-membership-check.decorator';

@ApiTags('Cashback')
@Controller('cashback')
@UseGuards(JwtAuthGuard)
@SkipMembershipCheck()
@ApiBearerAuth()
export class CashbackController {
  constructor(private readonly centralService: CentralIntegrationService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current cashback balance' })
  @ApiResponse({ status: 200, description: 'Returns the current cashback balance.' })
  async getBalance(@CurrentUser() user) {
    // Assuming user entity has email. If not, handle accordingly.
    return { balance: await this.centralService.getCashbackBalance(user.email) };
  }

  @Post('rules')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a cashback rule (Admin)' })
  async createRule(@Body() body: any, @CurrentUser() user) {
      // body should match CreateCashbackRuleDto structure + adminId
      return this.centralService.createCashbackRule(
          body.eventType,
          body.rewardType,
          body.rewardValue,
          user.id
      );
  }

  @Get('rules')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'List all cashback rules (Admin)' })
  async getRules() {
      return this.centralService.getRules();
  }

  @Patch('rules/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a cashback rule (Admin)' })
  async updateRule(@Param('id') id: string, @Body() body: any) {
      return this.centralService.updateRule(id, body);
  }

  @Delete('rules/:id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a cashback rule (Admin)' })
  async deleteRule(@Param('id') id: string) {
      return this.centralService.deleteRule(id);
  }
}
