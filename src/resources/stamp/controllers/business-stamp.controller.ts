import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { StampService } from "../services/stamp.service";
import { ActivateStampRewardDto } from "../dto/activate-stamp-reward.dto";
import { ScanParticipantQrDto } from "../dto/scan-participant-qr.dto";
import { RedeemStampCardDto } from "../dto/redeem-stamp-card.dto";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StampRewardTemplate } from "../entities/stamp-reward-template.entity";
import { BusinessStampReward } from "../entities/business-stamp-reward.entity";
import { StampCard } from "../entities/stamp-card.entity";

@ApiTags("Business Stamp Rewards")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("business/stamps")
export class BusinessStampController {
  constructor(private readonly stampService: StampService) {}

  @Get("templates")
  @Roles(Role.Business)
  @ApiOperation({ summary: "List available templates to activate" })
  @ApiOkResponse({ type: [StampRewardTemplate] })
  getLibrary() {
    return this.stampService.getBusinessTemplates();
  }

  @Post("activate")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Activate a stamp reward template" })
  @ApiCreatedResponse({ type: BusinessStampReward })
  activate(@CurrentUser() user: any, @Body() dto: ActivateStampRewardDto) {
    // Only Business Owners can activate rewards
    return this.stampService.activateTemplate(user.id, dto);
  }

  @Get("active")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "List active stamp rewards" })
  @ApiOkResponse({ type: [BusinessStampReward] })
  async getActive(@CurrentUser() user: any) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.getBusinessActiveRewards(businessId);
  }

  @Get("stats")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Get statistics for active stamp rewards" })
  async getStats(@CurrentUser() user: any) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.getBusinessRewardStats(businessId);
  }

  @Post("scan")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Scan participant QR to add a stamp" })
  @ApiCreatedResponse({ type: StampCard })
  async addStamp(@CurrentUser() user: any, @Body() dto: ScanParticipantQrDto) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.addStampByScan(businessId, dto);
  }

  @Post("redeem")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Redeem a completed stamp card" })
  @ApiOkResponse({ type: StampCard })
  async redeem(@CurrentUser() user: any, @Body() dto: RedeemStampCardDto) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.redeemReward(
      businessId,
      dto.participantUniqueCode,
      dto.stampCardId,
    );
  }

  @Post("active/:id/pause")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Pause a reward" })
  @ApiOkResponse({ type: BusinessStampReward })
  async pause(@CurrentUser() user: any, @Param("id") id: string) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.pauseReward(businessId, id);
  }

  @Post("active/:id/resume")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Resume a reward" })
  @ApiOkResponse({ type: BusinessStampReward })
  async resume(@CurrentUser() user: any, @Param("id") id: string) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.resumeReward(businessId, id);
  }

  @Delete("active/:id")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "Deactivate (soft delete) a reward" })
  async deactivate(@CurrentUser() user: any, @Param("id") id: string) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.deactivateReward(businessId, id);
  }

  @Get("active/:id/customers")
  @Roles(Role.Business, Role.Staff)
  @ApiOperation({ summary: "List customers for a specific reward" })
  @ApiOkResponse({ type: [StampCard] })
  async getCustomers(@CurrentUser() user: any, @Param("id") id: string) {
    const businessId = await this.stampService.resolveBusinessId(
      user.id,
      user.role,
    );
    return this.stampService.getRewardCustomers(businessId, id);
  }
}
