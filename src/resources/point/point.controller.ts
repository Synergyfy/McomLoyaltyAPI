import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PointService } from './point.service';
import { AwardPointDto } from './dto/award-point.dto';
import { PointLogDto } from './dto/point-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { ParticipantQueryDto } from './dto/participant-query.dto';
import { ParticipantDetailQueryDto } from './dto/participant-detail-query.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';

@ApiTags('Point')
@ApiBearerAuth()
@Controller('point')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Get('participant/code')
  @Roles(Role.Participant)
  @ApiOperation({
    summary: 'Get a unique 9-digit code for the participant.',
    description: 'Accessible by Participants.',
  })
  @ApiResponse({ status: 200, description: 'Code returned successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantCode(@CurrentUser() currentUser: User) {
    return this.pointService.getParticipantCode(currentUser);
  }

  @Post('business/generate-code')
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({
    summary: 'Generate a unique 9-digit code for awarding points.',
    description: 'Accessible by Business Owners and Staff.',
  })
  @ApiResponse({ status: 201, description: 'Code generated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  generateBusinessCode() {
    return this.pointService.generateBusinessCode();
  }

  @Post('award')
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({
    summary: 'Award points to a participant.',
    description: 'Accessible by Business Owners and Staff.',
  })
  @ApiResponse({ status: 201, description: 'Points awarded successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  awardPoint(@Body() awardPointDto: AwardPointDto, @CurrentUser() currentUser: User) {
    return this.pointService.awardPoint(awardPointDto, currentUser);
  }

  @Get('balance')
  @Roles(Role.Participant)
  @ApiOperation({
    summary: "Get the current participant's total point balance.",
    description: 'Accessible by Participants.',
  })
  @ApiResponse({ status: 200, description: 'Returns the total point balance.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantBalance(@CurrentUser() currentUser: User) {
    return this.pointService.getParticipantBalance(currentUser.id);
  }

  @Get('balance/:campaignId')
  @Roles(Role.Participant)
  @ApiOperation({
    summary: "Get the current participant's point balance for a specific campaign.",
    description: 'Accessible by Participants.',
  })
  @ApiResponse({ status: 200, description: 'Returns the campaign-specific point balance.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantBalanceByCampaign(
    @CurrentUser() currentUser: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.pointService.getParticipantBalance(currentUser.id, campaignId);
  }

  @Get('history')
  @Roles(Role.Participant)
  @ApiOperation({
    summary: "Get the current participant's entire point history.",
    description: 'Accessible by Participants.',
  })
  @ApiResponse({ status: 200, description: 'Returns the complete point history.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantHistory(@CurrentUser() currentUser: User) {
    return this.pointService.getParticipantHistory(currentUser.id);
  }

  @Get('history/:campaignId')
  @Roles(Role.Participant)
  @ApiOperation({
    summary: "Get the current participant's point history for a specific campaign.",
    description: 'Accessible by Participants.',
  })
  @ApiResponse({ status: 200, description: 'Returns the campaign-specific point history.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantHistoryByCampaign(
    @CurrentUser() currentUser: User,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.pointService.getParticipantHistory(currentUser.id, campaignId);
  }

  @Get('logs')
  @Roles(Role.Business)
  @ApiOperation({
    summary: 'Get the point logs for the business.',
    description: 'Accessible by Business Owners. Can be filtered by campaign.',
  })
  @ApiResponse({ status: 200, description: 'Returns the point logs.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getPointLogs(@CurrentUser() currentUser: User, @Query() pointLogDto: PointLogDto) {
    return this.pointService.getPointLogs(currentUser, pointLogDto);
  }

  @Get('business/participants')
  @Roles(Role.Business)
  @ApiOperation({
    summary: 'Get a paginated list of participants for the business.',
    description: 'Accessible by Business Owners. Can be filtered by campaign.',
  })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of participants.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getBusinessParticipants(
    @CurrentUser() currentUser: User,
    @Query() query: ParticipantQueryDto,
  ) {
    return this.pointService.getBusinessParticipants(currentUser, query);
  }

  @Get('business/participants/:participantId')
  @Roles(Role.Business)
  @ApiOperation({
    summary: 'Get a specific participant\'s details for the business.',
    description: 'Accessible by Business Owners. Can be filtered by campaign.',
  })
  @ApiResponse({ status: 200, description: 'Returns the participant\'s details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getParticipantDetails(
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Query() query: ParticipantDetailQueryDto,
  ) {
    return this.pointService.getParticipantDetails(participantId, query);
  }
}
