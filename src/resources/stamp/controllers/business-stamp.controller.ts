import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { StampService } from '../services/stamp.service';
import { ActivateStampRewardDto } from '../dto/activate-stamp-reward.dto';
import { ScanParticipantQrDto } from '../dto/scan-participant-qr.dto';
import { RedeemStampCardDto } from '../dto/redeem-stamp-card.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StampRewardTemplate } from '../entities/stamp-reward-template.entity';
import { BusinessStampReward } from '../entities/business-stamp-reward.entity';
import { StampCard } from '../entities/stamp-card.entity';

@ApiTags('Business Stamp Rewards')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('business/stamps')
export class BusinessStampController {
  constructor(private readonly stampService: StampService) {}

  @Get('templates')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'List available templates to activate' })
  @ApiOkResponse({ type: [StampRewardTemplate] })
  getLibrary() {
    return this.stampService.getBusinessTemplates();
  }

  @Post('activate')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Activate a stamp reward template' })
  @ApiCreatedResponse({ type: BusinessStampReward })
  activate(@CurrentUser() user: any, @Body() dto: ActivateStampRewardDto) {
    // CurrentUser for Business role usually has the business ID or user ID linked to business.
    // Assuming user.id is the business id or user has a businessId property.
    // Based on memory: "For endpoints specific to an authenticated user ... use @CurrentUser"
    // And "There is no central user table; user data is stored in separate tables... A UserService provides a unified interface".
    // If logged in as Business, user.id is likely the business entity ID.
    return this.stampService.activateTemplate(user.id, dto);
  }

  @Get('active')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'List active stamp rewards' })
  @ApiOkResponse({ type: [BusinessStampReward] })
  getActive(@CurrentUser() user: any) {
    return this.stampService.getBusinessActiveRewards(user.id);
  }

  @Get('stats')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Get statistics for active stamp rewards' })
  getStats(@CurrentUser() user: any) {
    return this.stampService.getBusinessRewardStats(user.id);
  }

  @Post('scan')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Scan participant QR to add a stamp' })
  @ApiCreatedResponse({ type: StampCard })
  addStamp(@CurrentUser() user: any, @Body() dto: ScanParticipantQrDto) {
    return this.stampService.addStampByScan(user.id, dto);
  }

  @Post('redeem')
  @Roles(Role.Business)
  @ApiOperation({ summary: 'Redeem a completed stamp card' })
  @ApiOkResponse({ type: StampCard })
  redeem(@CurrentUser() user: any, @Body() dto: RedeemStampCardDto) {
      return this.stampService.redeemReward(user.id, dto.participantUniqueCode);
  }
}
