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
} from "@nestjs/common";
import { SubcategoryService } from "./subcategory.service";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubcategoryDto } from "./dto/update-subcategory.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "src/common/role.enum";

@ApiTags("Subcategory Management")
@Controller("subcategories")
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new subcategory (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The subcategory has been successfully created.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBody({ type: CreateSubcategoryDto })
  @Roles(Role.Admin)
  create(
    @Body(new ValidationPipe()) createSubcategoryDto: CreateSubcategoryDto,
  ) {
    return this.subcategoryService.create(createSubcategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all subcategories (Public)" })
  @ApiResponse({
    status: 200,
    description: "Returns an array of all subcategories.",
  })
  findAll() {
    return this.subcategoryService.findAll();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a specific subcategory by ID (Public)" })
  @ApiResponse({ status: 200, description: "Returns the subcategory." })
  @ApiResponse({ status: 404, description: "Subcategory not found." })
  @ApiParam({ name: "id", description: "The ID of the subcategory." })
  findOne(@Param("id") id: string) {
    return this.subcategoryService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a subcategory (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The subcategory has been successfully updated.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Subcategory not found." })
  @ApiParam({ name: "id", description: "The ID of the subcategory to update." })
  @ApiBody({ type: UpdateSubcategoryDto })
  @Roles(Role.Admin)
  update(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.subcategoryService.update(id, updateSubcategoryDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a subcategory (Admin only)" })
  @ApiResponse({
    status: 204,
    description: "The subcategory has been successfully deleted.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Subcategory not found." })
  @ApiParam({ name: "id", description: "The ID of the subcategory to delete." })
  @Roles(Role.Admin)
  remove(@Param("id") id: string) {
    return this.subcategoryService.remove(id);
  }
}
