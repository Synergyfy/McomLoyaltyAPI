import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
} from "@nestjs/common";
import { DealService } from "./deal.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { UpdateDealStatusDto } from "./dto/update-deal-status.dto";
import { DeactivateDealDto } from "./dto/deactivate-deal.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../common/interfaces/user.interface";
import { FilterDealDto } from "./dto/filter-deal.dto";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Deals")
@ApiBearerAuth()
@Controller("deals")
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Create a new deal" })
  @ApiResponse({
    status: 201,
    description: "The deal has been successfully created.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  create(@Body() createDealDto: CreateDealDto, @CurrentUser() user: User) {
    return this.dealService.create(createDealDto, user);
  }

  @Get("admin/all")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get all deals (Admin)" })
  @ApiResponse({
    status: 200,
    description: "Return a paginated list of deals with details.",
  })
  findAllAdmin(@Query() filterDealDto: FilterDealDto) {
    return this.dealService.findAllAdmin(filterDealDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all deals" })
  @ApiResponse({ status: 200, description: "Return a list of deals." })
  findAll(@Query() filterDealDto: FilterDealDto, @CurrentUser() user?: User) {
    return this.dealService.findAll(filterDealDto, user);
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Get a deal by ID" })
  @ApiResponse({ status: 200, description: "Return the deal." })
  @ApiResponse({ status: 404, description: "Deal not found." })
  findOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.dealService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Update a deal" })
  @ApiResponse({
    status: 200,
    description: "The deal has been successfully updated.",
  })
  @ApiResponse({ status: 404, description: "Deal not found." })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() user: User,
  ) {
    return this.dealService.update(id, updateDealDto, user);
  }

  @Delete(":id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Delete a deal" })
  @ApiResponse({
    status: 200,
    description: "The deal has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Deal not found." })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.dealService.remove(id, user);
  }

  @Patch(":id/status")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a deal status (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The deal status has been successfully updated.",
  })
  @ApiResponse({ status: 404, description: "Deal not found." })
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDealStatusDto: UpdateDealStatusDto,
  ) {
    return this.dealService.updateStatus(id, updateDealStatusDto.status);
  }

  @Patch(":id/deactivate")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Deactivate a deal" })
  @ApiResponse({
    status: 200,
    description: "The deal has been successfully deactivated.",
  })
  @ApiResponse({ status: 404, description: "Deal not found." })
  deactivate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() deactivateDealDto: DeactivateDealDto,
    @CurrentUser() user: User,
  ) {
    return this.dealService.deactivate(id, deactivateDealDto.isActive, user);
  }

  @Post(":id/link-campaign")
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({ summary: "Link a deal to a campaign" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        type: { type: "string", enum: ["business", "standard"] },
      },
    },
  })
  async linkToCampaign(
    @Param("id") id: string,
    @Body() body: { campaignId: string; type: "business" | "standard" },
    @CurrentUser() user: User,
  ) {
    return this.dealService.linkToCampaign(
      id,
      body.campaignId,
      body.type,
      user,
    );
  }

  @Public()
  @Get("public/all")
  @ApiOperation({ summary: "Get all public deals" })
  @ApiResponse({
    status: 200,
    description: "Return a paginated list of public deals.",
  })
  findAllPublic(@Query() filterDealDto: FilterDealDto) {
    return this.dealService.findAllPublic(filterDealDto);
  }

  @Public()
  @Get("public/:id")
  @ApiOperation({ summary: "Get a public deal by ID" })
  @ApiResponse({ status: 200, description: "Return the deal." })
  @ApiResponse({ status: 404, description: "Deal not found." })
  findOnePublic(@Param("id", ParseUUIDPipe) id: string) {
    return this.dealService.findOnePublic(id);
  }
}
