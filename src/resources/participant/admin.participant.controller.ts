import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  Patch,
  Body,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { ParticipantService } from "./participant.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Participant } from "./entities/participant.entity";
import { UpdateParticipantDto } from "./dto/update-participant.dto";
import { PointHistory } from "../participant-campaign-balance/entities/point-history.entity";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller("admin/participants")
export class AdminParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Get()
  @ApiOperation({ summary: "Get all participants (admin only)" })
  @ApiResponse({
    status: 200,
    description: "A paginated list of all participants.",
    type: [Participant],
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.participantService.findAll(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single participant by ID (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The participant with the specified ID.",
    type: Participant,
  })
  @ApiResponse({ status: 404, description: "Participant not found." })
  async findOne(@Param("id") id: string) {
    return this.participantService.findById(id, ["campaigns"]);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a participant (admin only)" })
  @ApiResponse({
    status: 204,
    description: "The participant has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Participant not found." })
  async remove(@Param("id") id: string) {
    return this.participantService.delete(id);
  }

  @Patch(":id/disable")
  @ApiOperation({ summary: "Disable a participant (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The participant has been successfully disabled.",
  })
  @ApiResponse({ status: 404, description: "Participant not found." })
  async disable(@Param("id") id: string) {
    return this.participantService.update(id, { isDisabled: true });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a participant (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The participant has been successfully updated.",
    type: Participant,
  })
  @ApiResponse({ status: 404, description: "Participant not found." })
  async update(
    @Param("id") id: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantService.update(id, updateParticipantDto);
  }

  @Delete(":participantId/campaigns/:campaignId")
  @ApiOperation({
    summary: "Remove a participant from a campaign (admin only)",
  })
  @ApiResponse({
    status: 204,
    description:
      "The participant has been successfully removed from the campaign.",
  })
  @ApiResponse({
    status: 404,
    description: "Participant or campaign not found.",
  })
  async removeFromCampaign(
    @Param("participantId") participantId: string,
    @Param("campaignId") campaignId: string,
  ) {
    return this.participantService.removeFromCampaign(
      participantId,
      campaignId,
    );
  }

  @Get(":id/history")
  @ApiOperation({
    summary: "Get a participant's earning and redeeming history (admin only)",
  })
  @ApiResponse({
    status: 200,
    description:
      "A paginated list of a participant's earning and redeeming history.",
    type: [PointHistory],
  })
  async getHistory(
    @Param("id") id: string,
    @Query() paginationDto: PaginationDto,
    @Query("campaignId") campaignId?: string,
    @Query("businessId") businessId?: string,
  ) {
    return this.participantService.getHistory(
      id,
      paginationDto.page,
      paginationDto.limit,
      campaignId,
      businessId,
    );
  }
}
