import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  Patch,
  Body,
  Post,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { BusinessService } from "../services/business.service";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { PageDto } from "../../../common/dto/page.dto";
import { Business } from "../entities/business.entity";
import { StaffService } from "../../staff/services/staff.service";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { UpdateStaffDto } from "../../staff/dto/update-staff.dto";
import { AdminService } from "../../admin/services/admin.service";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller("admin/businesses")
export class AdminBusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly staffService: StaffService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all businesses (admin only)" })
  @ApiResponse({
    status: 200,
    description: "A paginated list of all businesses.",
    type: PageDto,
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.adminService.getBusinesses(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get("super")
  @ApiOperation({ summary: "Get all super businesses (admin only)" })
  @ApiResponse({
    status: 200,
    description: "A paginated list of all super businesses.",
    type: PageDto,
  })
  async findSuperBusinesses(@Query() paginationDto: PaginationDto) {
    return this.adminService.getSuperBusinesses(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single business by ID (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The business with the specified ID.",
    type: Business,
  })
  @ApiResponse({ status: 404, description: "Business not found." })
  async findOne(@Param("id") id: string) {
    return this.adminService.getBusiness(id);
  }

  @Get(":id/staffs")
  @ApiOperation({ summary: "Get all staff for a business (admin only)" })
  @ApiResponse({
    status: 200,
    description: "A paginated list of all staff for a business.",
    type: PageDto,
  })
  async findStaff(
    @Param("id") id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.staffService.findAll(
      id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a business (admin only)" })
  @ApiResponse({
    status: 204,
    description: "The business has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Business not found." })
  async remove(@Param("id") id: string) {
    return this.businessService.delete(id);
  }

  @Patch(":id/disable")
  @ApiOperation({ summary: "Disable a business (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The business has been successfully disabled.",
  })
  @ApiResponse({ status: 404, description: "Business not found." })
  async disable(@Param("id") id: string) {
    return this.adminService.disableBusiness(id);
  }

  @Get(":id/participants")
  @ApiOperation({
    summary: "Get all participants for a business's campaigns (admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "A paginated list of all participants for a business.",
    type: PageDto,
  })
  async findAllParticipants(
    @Param("id") id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.businessService.findAllParticipants(
      id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a business (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The business has been successfully updated.",
    type: Business,
  })
  @ApiResponse({ status: 404, description: "Business not found." })
  async update(
    @Param("id") id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.adminService.updateBusiness(id, updateBusinessDto);
  }

  @Patch("staffs/:id")
  @ApiOperation({ summary: "Update a staff member (admin only)" })
  @ApiResponse({
    status: 200,
    description: "The staff member has been successfully updated.",
    type: Business,
  })
  @ApiResponse({ status: 404, description: "Staff member not found." })
  async updateStaff(
    @Param("id") id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.adminService.updateStaff(id, updateStaffDto);
  }
  @Get(":id/points/balance/monthly")
  @ApiOperation({
    summary: "Get monthly point balance for a business (admin only)",
  })
  @ApiResponse({ status: 200, description: "Return monthly point balance." })
  async getMonthlyPointBalance(@Param("id") id: string) {
    return this.businessService.getMonthlyPointBalance(id);
  }

  @Get(":id/points/balance/total")
  @ApiOperation({
    summary: "Get total subscription point balance for a business (admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Return total subscription point balance.",
  })
  async getTotalSubscriptionPointBalance(@Param("id") id: string) {
    return this.businessService.getTotalSubscriptionPointBalance(id);
  }

  @Post(":id/points/reset")
  @ApiOperation({
    summary: "Reset monthly extra points for a business (admin only)",
  })
  @ApiResponse({ status: 200, description: "Points reset successfully." })
  async resetMonthlyPoints(@Param("id") id: string) {
    return this.businessService.resetMonthlyPoints(id);
  }
}
