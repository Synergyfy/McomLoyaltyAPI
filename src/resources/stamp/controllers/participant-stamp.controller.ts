import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { StampService } from '../services/stamp.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StampCard } from '../entities/stamp-card.entity';
import { BusinessStampReward } from '../entities/business-stamp-reward.entity';
import { StartStampCardDto } from '../dto/start-stamp-card.dto';

@ApiTags('Participant Stamp Cards')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('participant/stamps')
export class ParticipantStampController {
  constructor(private readonly stampService: StampService) {}

  @Get('discover')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'Get all available rewards matching user criteria/location' })
  @ApiOkResponse({ type: [BusinessStampReward] })
  discover() {
      return this.stampService.discoverRewards();
  }

  @Post('start')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'Self-enroll in a stamp reward' })
  @ApiOkResponse({ type: StampCard })
  start(@CurrentUser() user: any, @Body() dto: StartStampCardDto) {
      return this.stampService.startCard(user.id, dto.businessStampRewardId);
  }

  @Get('stats')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'Get aggregated stats for participant stamps' })
  getStats(@CurrentUser() user: any) {
      return this.stampService.getParticipantStats(user.id);
  }

  @Get('my-cards')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'List my stamp cards' })
  @ApiOkResponse({ type: [StampCard] })
  getMyCards(@CurrentUser() user: any) {
    return this.stampService.getMyStampCards(user.id);
  }

  @Get('card/:id')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'Get details of a specific stamp card' })
  @ApiOkResponse({ type: StampCard })
  getCardDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stampService.getStampCardDetails(id, user.id);
  }

  @Get('business/:businessId')
  @Roles(Role.Participant)
  @ApiOperation({ summary: 'Get available stamp rewards for a specific business' })
  @ApiOkResponse({ type: [BusinessStampReward] })
  getBusinessRewards(@Param('businessId') businessId: string) {
      return this.stampService.getBusinessActiveRewards(businessId);
  }
}
