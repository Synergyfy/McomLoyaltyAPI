import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { ParticipantProgressionService } from "./participant-progression.service";
import { CreateParticipantBadgeDto } from "./dto/create-participant-badge.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { ParticipantBadge } from "./entities/participant-badge.entity";
import { CreateEarningActionDto } from "./dto/create-earning-action.dto";
import { EarningAction } from "./entities/earning-action.entity";
import { ManualPromoteDto } from "./dto/manual-promote.dto";
import { TrackEventDto } from "./dto/track-event.dto";
import { ParticipantProgressionResponseDto } from "./dto/participant-progression-response.dto";

@ApiTags("Participant Progression")
@Controller("participant-progression")
@ApiBearerAuth()
export class ParticipantProgressionController {
  constructor(
    private readonly progressionService: ParticipantProgressionService,
  ) {}

  // --- Badges ---

  @Post("badges")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a new badge level (Admin only)" })
  @ApiResponse({ type: ParticipantBadge })
  async createBadge(@Body() dto: CreateParticipantBadgeDto) {
    return this.progressionService.createBadge(dto);
  }

  @Get("badges")
  @Roles(Role.Admin, Role.Business, Role.Participant)
  @ApiOperation({ summary: "Get all badge levels" })
  @ApiResponse({ type: [ParticipantBadge] })
  async getBadges() {
    return this.progressionService.getBadges();
  }

  @Patch("badges/:id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a badge level (Admin only)" })
  @ApiResponse({ type: ParticipantBadge })
  async updateBadge(
    @Param("id") id: string,
    @Body() dto: Partial<CreateParticipantBadgeDto>,
  ) {
    return this.progressionService.updateBadge(id, dto);
  }

  // --- Earning Actions ---

  @Post("earning-actions")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a new earning action rule (Admin only)" })
  @ApiResponse({ type: EarningAction })
  async createAction(@Body() dto: CreateEarningActionDto) {
    return this.progressionService.createAction(dto);
  }

  @Get("earning-actions")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get all earning actions (Admin only)" })
  @ApiResponse({ type: [EarningAction] })
  async getActions() {
    return this.progressionService.getActions();
  }

  @Patch("earning-actions/:id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update an earning action rule (Admin only)" })
  @ApiResponse({ type: EarningAction })
  async updateAction(
    @Param("id") id: string,
    @Body() dto: Partial<CreateEarningActionDto>,
  ) {
    return this.progressionService.updateAction(id, dto);
  }

  // --- Operations ---

  @Post("manual-promote")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Manually promote a participant to a specific badge (Admin only)",
  })
  async manualPromote(@Body() dto: ManualPromoteDto) {
    return this.progressionService.manualPromote(
      dto.participantId,
      dto.badgeId,
    );
  }

  @Post("track-event")
  @Roles(Role.Participant)
  @ApiOperation({ summary: "Track a client-side event (Participant only)" })
  async trackEvent(@Req() req, @Body() dto: TrackEventDto) {
    const participantId = req.user.id;
    return this.progressionService.triggerAction(
      participantId,
      dto.actionKey,
      dto.meta,
    );
  }

  @Post("track-app-open")
  @Roles(Role.Participant)
  @ApiOperation({ summary: "Track app open event (Daily count & Streaks)" })
  async trackAppOpen(@Req() req) {
    return this.progressionService.trackAppOpen(req.user.id);
  }

  @Get("my-progression")
  @Roles(Role.Participant)
  @ApiOperation({
    summary: "Get the current participant's progression details",
  })
  @ApiResponse({
    status: 200,
    description: "Returns detailed badge progression and requirements.",
    type: ParticipantProgressionResponseDto,
  })
  async getMyProgression(@Req() req) {
    return this.progressionService.getMyDetailedProgression(req.user.id);
  }
}
