import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
} from "@nestjs/common";
import { SectorService } from "../services/sector.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { CreateSectorDto } from "../dto/create-sector.dto";
import { UpdateSectorDto } from "../dto/update-sector.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "src/common/role.enum";

@ApiTags("Sector Management")
@Controller("sectors")
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new sector (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The sector has been successfully created.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBody({ type: CreateSectorDto })
  @Roles(Role.Admin)
  create(@Body(new ValidationPipe()) createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all sectors (Public)" })
  @ApiResponse({ status: 200, description: "Returns an array of all sectors." })
  findAll() {
    return this.sectorService.findAll();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a specific sector by ID (Public)" })
  @ApiResponse({ status: 200, description: "Returns the sector." })
  @ApiResponse({ status: 404, description: "Sector not found." })
  @ApiParam({ name: "id", description: "The ID of the sector." })
  findOne(@Param("id") id: string) {
    return this.sectorService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a sector (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The sector has been successfully updated.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Sector not found." })
  @ApiParam({ name: "id", description: "The ID of the sector to update." })
  @ApiBody({ type: UpdateSectorDto })
  @Roles(Role.Admin)
  update(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateSectorDto: UpdateSectorDto,
  ) {
    return this.sectorService.update(id, updateSectorDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a sector (Admin only)" })
  @ApiResponse({
    status: 204,
    description: "The sector has been successfully deleted.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Sector not found." })
  @ApiParam({ name: "id", description: "The ID of the sector to delete." })
  @Roles(Role.Admin)
  remove(@Param("id") id: string) {
    return this.sectorService.remove(id);
  }

  @Public()
  @Get(":sectorId/categories")
  @ApiOperation({ summary: "Get all categories for a specific sector" })
  @ApiResponse({
    status: 200,
    description: "Return all categories for a sector.",
  })
  getCategoriesBySector(
    @Param("sectorId") sectorId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.sectorService.getCategoriesBySector(sectorId, paginationDto);
  }
}
