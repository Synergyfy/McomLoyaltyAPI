import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AdminService } from "../services/admin.service";
import { CreateAdminDto } from "../dto/create-admin.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { Public } from "../../../common/decorators/public.decorator";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { PageDto } from "../../../common/dto/page.dto";
import { Business } from "../../business/entities/business.entity";
import { UpdateBusinessDto } from "../../business/dto/update-business.dto";
import { Staff } from "../../staff/entities/staff.entity";
import { UpdateStaffDto } from "../../staff/dto/update-staff.dto";
import { UpdateCampaignDto } from "../../campaign/dto/update-campaign.dto";
import { CreateSuperBusinessDto } from "../dto/create-super-business.dto";

@ApiTags("admin")
@Controller("admin")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "Create a new admin account" })
  @ApiResponse({
    status: 201,
    description: "The admin has been successfully created.",
  })
  @ApiBody({ type: CreateAdminDto })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Roles(Role.Admin)
  @Post("create-super-business")
  @ApiOperation({ summary: "Admin: Create a super business (platform owned)" })
  @ApiResponse({
    status: 201,
    description: "The super business has been successfully created.",
  })
  @ApiBody({ type: CreateSuperBusinessDto })
  createSuperBusiness(@Body() createSuperBusinessDto: CreateSuperBusinessDto) {
    return this.adminService.createSuperBusiness(createSuperBusinessDto);
  }

  @Get("search")
  @ApiOperation({
    summary:
      "Admin: Search businesses, participants, staffs, rewards, campaigns",
  })
  @ApiResponse({ status: 200, description: "Search results." })
  search(@Query("q") query: string) {
    if (!query) {
      return [];
    }
    return this.adminService.globalSearch(query);
  }

  @Roles(Role.Admin)
  @Patch("campaigns/:id")
  @ApiOperation({ summary: "Admin: Update or disable campaign" })
  @ApiResponse({ status: 200, description: "Campaign updated." })
  async updateCampaign(
    @Param("id") id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.adminService.updateCampaign(id, updateCampaignDto);
  }
}
