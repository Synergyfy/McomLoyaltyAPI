import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { LoginParticipantDto } from "./dto/login-participant.dto";
import { JoinCampaignDto } from "./dto/join-campaign.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Public } from "src/common/decorators/public.decorator";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Participant } from "./entities/participant.entity";
import { RewardsService } from "../rewards/services/rewards.service";

@ApiTags("Participant")
@Controller("participant")
export class ParticipantController {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly rewardsService: RewardsService,
  ) {}

  @Public()
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new participant" })
  @ApiResponse({
    status: 201,
    description: "The participant has been successfully created.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 409, description: "Email already exists." })
  signup(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantService.signup(createParticipantDto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login as a participant" })
  @ApiResponse({
    status: 200,
    description: "The participant has been successfully logged in.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  login(@Body() loginParticipantDto: LoginParticipantDto) {
    return this.participantService.login(loginParticipantDto);
  }

  @Post("join-campaign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Join a campaign" })
  @ApiResponse({
    status: 200,
    description: "Successfully joined the campaign.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
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

  @Get("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get participant profile" })
  @ApiResponse({
    status: 200,
    description: "Returns the participant profile and campaign balances.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBearerAuth()
  getProfile(@CurrentUser() participant: Participant) {
    return this.participantService.getProfile(participant.id);
  }

  @Get("campaigns")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get participating campaigns" })
  @ApiResponse({
    status: 200,
    description:
      "Returns a paginated list of campaigns the participant has joined.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getParticipatingCampaigns(
    @CurrentUser() participant: Participant,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.participantService.getParticipatingCampaigns(
      participant.id,
      +page,
      +limit,
    );
  }

  @Get("mall-reward-history")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get participant mall reward distribution history" })
  @ApiResponse({
    status: 200,
    description:
      "Returns a paginated list of mall rewards the participant has redeemed.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getMallRewardHistory(
    @CurrentUser() participant: Participant,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.rewardsService.getParticipantMallRewardHistory(
      participant.id,
      +page,
      +limit,
    );
  }
}
