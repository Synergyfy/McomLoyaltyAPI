import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PointService } from './point.service';
import { AwardPointDto } from './dto/award-point.dto';
import { PointLogDto } from './dto/point-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';

@Controller('point')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Post('award')
  @Roles(Role.Business, Role.Staff)
  awardPoint(@Body() awardPointDto: AwardPointDto, @CurrentUser() currentUser: User) {
    return this.pointService.awardPoint(awardPointDto, currentUser);
  }

  @Get('balance')
  @Roles(Role.Participant)
  getParticipantBalance(@CurrentUser() currentUser: User) {
    return this.pointService.getParticipantBalance(currentUser.id);
  }

  @Get('balance/:campaignId')
  @Roles(Role.Participant)
  getParticipantBalanceByCampaign(
    @CurrentUser() currentUser: User,
    @Param('campaignId') campaignId: string,
  ) {
    return this.pointService.getParticipantBalance(currentUser.id, campaignId);
  }

  @Get('history')
  @Roles(Role.Participant)
  getParticipantHistory(@CurrentUser() currentUser: User) {
    return this.pointService.getParticipantHistory(currentUser.id);
  }

  @Get('history/:campaignId')
  @Roles(Role.Participant)
  getParticipantHistoryByCampaign(
    @CurrentUser() currentUser: User,
    @Param('campaignId') campaignId: string,
  ) {
    return this.pointService.getParticipantHistory(currentUser.id, campaignId);
  }

  @Get('logs')
  @Roles(Role.Business)
  getPointLogs(@CurrentUser() currentUser: User, @Query() pointLogDto: PointLogDto) {
    return this.pointService.getPointLogs(currentUser, pointLogDto);
  }
}
