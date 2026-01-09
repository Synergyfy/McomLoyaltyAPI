import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { TierService } from "./tier.service";
import { CreateTierDto } from "./dto/create-tier.dto";
import { UpdateTierDto } from "./dto/update-tier.dto";
import { UpdateTierProgressionDto } from "./dto/update-tier-progression.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { Tier } from "./entities/tier.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Admin } from "../admin/entities/admin.entity";
import { Public } from "src/common/decorators/public.decorator";
import { TierBreakdownDto } from "./dto/tier-breakdown.dto";
import { TierType } from "./entities/tier-type.enum";

@ApiTags("Tier")
@Controller("tier")
@ApiBearerAuth()
export class TierController {
  constructor(private readonly tierService: TierService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a new tier (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The tier has been successfully created.",
    type: Tier,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  create(@Body() createTierDto: CreateTierDto, @CurrentUser() admin: Admin) {
    return this.tierService.create(createTierDto, admin);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all tiers" })
  @ApiQuery({
    name: "type",
    enum: [...Object.values(TierType), "all"],
    required: false,
    description: "Filter tiers by type (standard or seasonal). Default is all.",
  })
  @ApiResponse({ status: 200, description: "Return all tiers.", type: [Tier] })
  findAll(@Query("type") type?: string) {
    return this.tierService.findAll(type);
  }

  @Get("breakdown")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get tiers breakdown (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Return tiers breakdown.",
    type: [TierBreakdownDto],
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  getBreakdown() {
    return this.tierService.getTierBreakdown();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a tier by ID" })
  @ApiResponse({ status: 200, description: "Return the tier.", type: Tier })
  @ApiResponse({ status: 404, description: "Tier not found." })
  findOne(@Param("id") id: string) {
    return this.tierService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a tier (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The tier has been successfully updated.",
    type: Tier,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Tier not found." })
  update(
    @Param("id") id: string,
    @Body() updateTierDto: UpdateTierDto,
    @CurrentUser() admin: Admin,
  ) {
    return this.tierService.update(id, updateTierDto, admin);
  }

  @Patch(":id/progression")
  @Roles(Role.Admin)
  @ApiOperation({
    summary: "Update tier progression configuration (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "The tier progression has been successfully updated.",
    type: Tier,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Tier not found." })
  updateProgression(
    @Param("id") id: string,
    @Body() progressionDto: UpdateTierProgressionDto,
    @CurrentUser() admin: Admin,
  ) {
    return this.tierService.updateProgression(id, progressionDto, admin);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Delete a tier (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The tier has been successfully deleted.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Tier not found." })
  remove(@Param("id") id: string, @CurrentUser() admin: Admin) {
    return this.tierService.remove(id, admin);
  }
}
