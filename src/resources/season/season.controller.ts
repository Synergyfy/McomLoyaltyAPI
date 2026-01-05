import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { SeasonService } from "./season.service";
import { CreateSeasonDto } from "./dto/create-season.dto";
import { UpdateSeasonDto } from "./dto/update-season.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Season } from "./entities/season.entity";
import { Public } from "src/common/decorators/public.decorator";

@ApiTags("Season")
@Controller("season")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a new season (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The season has been successfully created.",
    type: Season,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  create(@Body() createSeasonDto: CreateSeasonDto) {
    return this.seasonService.create(createSeasonDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all seasons (Public)" })
  @ApiResponse({
    status: 200,
    description: "Return all seasons.",
    type: [Season],
  })
  findAll() {
    return this.seasonService.findAll();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a season by ID (Public)" })
  @ApiResponse({ status: 200, description: "Return the season.", type: Season })
  @ApiResponse({ status: 404, description: "Season not found." })
  findOne(@Param("id") id: string) {
    return this.seasonService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a season (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The season has been successfully updated.",
    type: Season,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Season not found." })
  update(@Param("id") id: string, @Body() updateSeasonDto: UpdateSeasonDto) {
    return this.seasonService.update(id, updateSeasonDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Delete a season (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The season has been successfully deleted.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Season not found." })
  remove(@Param("id") id: string) {
    return this.seasonService.remove(id);
  }
}
