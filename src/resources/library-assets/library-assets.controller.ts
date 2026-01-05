import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { LibraryAssetsService } from "./library-assets.service";
import { CreateLibraryAssetDto } from "./dto/create-library-asset.dto";
import { UpdateLibraryAssetDto } from "./dto/update-library-asset.dto";
import { SearchLibraryAssetDto } from "./dto/search-library-asset.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { LibraryAsset } from "./entities/library-asset.entity";
import { PageDto } from "../../common/dto/page.dto";

@ApiTags("Library Assets")
@Controller("library-assets")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LibraryAssetsController {
  constructor(private readonly libraryAssetsService: LibraryAssetsService) {}

  @Post()
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({
    summary: "Create a new library asset",
    description:
      "Business can upload their own assets. Admin can upload assets and tag them with sector/category.",
  })
  @ApiBody({ type: CreateLibraryAssetDto })
  @ApiResponse({
    status: 201,
    description: "The asset has been successfully created.",
    type: LibraryAsset,
  })
  create(@Body() createDto: CreateLibraryAssetDto, @Request() req) {
    return this.libraryAssetsService.create(createDto, req.user);
  }

  @Get()
  @Roles(Role.Business, Role.Admin, Role.Staff)
  @ApiOperation({
    summary: "Get a list of library assets",
    description:
      "Fetch paginated assets. Businesses see their own assets and Admin assets matching their sector (by default).",
  })
  @ApiResponse({
    status: 200,
    description: "Return paginated list of assets.",
    type: PageDto,
  })
  findAll(
    @Query(new ValidationPipe({ transform: true }))
    searchDto: SearchLibraryAssetDto,
    @Request() req,
  ) {
    return this.libraryAssetsService.findAll(searchDto, req.user);
  }

  @Get(":id")
  @Roles(Role.Business, Role.Admin, Role.Staff)
  @ApiOperation({
    summary: "Get a specific asset by ID",
    description:
      "Fetch a single asset if it belongs to the user or is a visible Admin asset.",
  })
  @ApiParam({ name: "id", description: "Asset UUID" })
  @ApiResponse({
    status: 200,
    description: "Return the asset.",
    type: LibraryAsset,
  })
  @ApiResponse({ status: 404, description: "Asset not found." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findOne(@Param("id") id: string, @Request() req) {
    return this.libraryAssetsService.findOne(id, req.user);
  }

  @Patch(":id")
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({
    summary: "Update an asset",
    description:
      "Business can only update their own assets. Admin can update Admin assets.",
  })
  @ApiParam({ name: "id", description: "Asset UUID" })
  @ApiBody({ type: UpdateLibraryAssetDto })
  @ApiResponse({
    status: 200,
    description: "The asset has been successfully updated.",
    type: LibraryAsset,
  })
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdateLibraryAssetDto,
    @Request() req,
  ) {
    return this.libraryAssetsService.update(id, updateDto, req.user);
  }

  @Delete(":id")
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({
    summary: "Delete an asset",
    description:
      "Business can only delete their own assets. Admin can delete Admin assets.",
  })
  @ApiParam({ name: "id", description: "Asset UUID" })
  @ApiResponse({
    status: 200,
    description: "The asset has been successfully deleted.",
  })
  remove(@Param("id") id: string, @Request() req) {
    return this.libraryAssetsService.remove(id, req.user);
  }
}
