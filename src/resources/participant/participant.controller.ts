import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { LoginParticipantDto } from './dto/login-participant.dto';
import { JoinCampaignDto } from './dto/join-campaign.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Participant } from './entities/participant.entity';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new participant' })
  @ApiResponse({
    status: 201,
    description: 'The participant has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  signup(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantService.signup(createParticipantDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as a participant' })
  @ApiResponse({
    status: 200,
    description: 'The participant has been successfully logged in.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  login(@Body() loginParticipantDto: LoginParticipantDto) {
    return this.participantService.login(loginParticipantDto);
  }

  @Post('join-campaign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a campaign' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the campaign.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth()
  joinCampaign(
    @CurrentUser() participant: Participant,
    @Body() joinCampaignDto: JoinCampaignDto,
  ) {
    return this.participantService.joinCampaign(
      participant.id,
      joinCampaignDto.campaignId,
    );
  }
}
