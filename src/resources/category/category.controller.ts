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
import { PaginationDto } from "src/common/dto/pagination.dto";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
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

@ApiTags("Category Management")
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new category (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The category has been successfully created.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiBody({ type: CreateCategoryDto })
  @Roles(Role.Admin)
  create(@Body(new ValidationPipe()) createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Get all categories (Public)" })
  @ApiResponse({
    status: 200,
    description: "Returns an array of all categories.",
  })
  findAll() {
    return this.categoryService.findAll();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a specific category by ID (Public)" })
  @ApiResponse({ status: 200, description: "Returns the category." })
  @ApiResponse({ status: 404, description: "Category not found." })
  @ApiParam({ name: "id", description: "The ID of the category." })
  findOne(@Param("id") id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a category (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The category has been successfully updated.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Category not found." })
  @ApiParam({ name: "id", description: "The ID of the category to update." })
  @ApiBody({ type: UpdateCategoryDto })
  @Roles(Role.Admin)
  update(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a category (Admin only)" })
  @ApiResponse({
    status: 204,
    description: "The category has been successfully deleted.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Category not found." })
  @ApiParam({ name: "id", description: "The ID of the category to delete." })
  @Roles(Role.Admin)
  remove(@Param("id") id: string) {
    return this.categoryService.remove(id);
  }

  @Public()
  @Get(":categoryId/subcategories")
  @ApiOperation({ summary: "Get all subcategories for a specific category" })
  @ApiResponse({
    status: 200,
    description: "Return all subcategories for a category.",
  })
  getSubCategoriesByCategory(
    @Param("categoryId") categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.categoryService.getSubCategoriesByCategory(
      categoryId,
      paginationDto,
    );
  }
}
