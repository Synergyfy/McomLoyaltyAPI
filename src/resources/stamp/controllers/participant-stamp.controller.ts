import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { StampService } from '../services/stamp.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StampCard } from '../entities/stamp-card.entity';
import { BusinessStampReward } from '../entities/business-stamp-reward.entity';

@ApiTags('Participant Stamp Cards')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('participant/stamps')
export class ParticipantStampController {
  constructor(private readonly stampService: StampService) {}

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
