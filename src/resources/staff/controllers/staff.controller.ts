import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { StaffService } from "../services/staff.service";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { CapabilitiesGuard } from "../../capability/guards/capabilities.guard";
import { CheckPermission } from "../../capability/decorators/check-permission.decorator";
import { ActionType } from "../../capability/capability.service";

@ApiTags("Staff Management")
@Controller("staff")
@UseGuards(CapabilitiesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles(Role.Business)
  @CheckPermission(ActionType.CREATE_STAFF)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new staff member (for logged-in business)",
  })
  @ApiResponse({
    status: 201,
    description: "The staff member has been successfully created.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Business not logged in).",
  })
  @ApiBody({ type: CreateStaffDto })
  create(
    @Body(new ValidationPipe()) createStaffDto: CreateStaffDto,
    @Request() req,
  ) {
    return this.staffService.create(createStaffDto, req.user.id);
  }

  @Roles(Role.Business, Role.Staff)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all staff members for the logged-in business" })
  @ApiResponse({
    status: 200,
    description: "Returns an array of staff members.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Business not logged in).",
  })
  findAll(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.staffService.findAll(req.user.id, page, limit);
  }

  @Roles(Role.Business, Role.Staff)
  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a specific staff member by ID" })
  @ApiResponse({ status: 200, description: "Returns the staff member." })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Business not logged in).",
  })
  @ApiResponse({ status: 404, description: "Staff member not found." })
  @ApiParam({ name: "id", description: "The ID of the staff member." })
  findOne(@Param("id") id: string, @Request() req) {
    return this.staffService.findOne(id, req.user.id);
  }

  @Roles(Role.Business)
  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a staff member" })
  @ApiResponse({
    status: 200,
    description: "The staff member has been successfully updated.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Business not logged in).",
  })
  @ApiResponse({ status: 404, description: "Staff member not found." })
  @ApiParam({
    name: "id",
    description: "The ID of the staff member to update.",
  })
  @ApiBody({ type: UpdateStaffDto })
  update(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateStaffDto: UpdateStaffDto,
    @Request() req,
  ) {
    return this.staffService.update(id, updateStaffDto, req.user.id);
  }

  @Roles(Role.Business)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a staff member" })
  @ApiResponse({
    status: 204,
    description: "The staff member has been successfully deleted.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Business not logged in).",
  })
  @ApiResponse({ status: 404, description: "Staff member not found." })
  @ApiParam({
    name: "id",
    description: "The ID of the staff member to delete.",
  })
  remove(@Param("id") id: string, @Request() req) {
    return this.staffService.remove(id, req.user.id);
  }
}
