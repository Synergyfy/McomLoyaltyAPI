import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { HelpCenterArticleService } from "../services/help-center-article.service";
import {
  CreateHelpCenterArticleDto,
  UpdateHelpCenterArticleDto,
  FilterHelpCenterArticleDto,
} from "../dto/help-center-article.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { Public } from "../../../common/decorators/public.decorator";

@ApiTags("help-center-articles")
@Controller("help-center-articles")
export class HelpCenterArticleController {
  constructor(private readonly articleService: HelpCenterArticleService) {}

  @ApiOperation({ summary: "Admin: Create a help center article" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() createDto: CreateHelpCenterArticleDto) {
    return this.articleService.create(createDto);
  }

  @ApiOperation({ summary: "Public: Get all articles (Paginated)" })
  @Public()
  @Get()
  findAll(@Query() filterDto: FilterHelpCenterArticleDto) {
    return this.articleService.findAll(filterDto);
  }

  @ApiOperation({ summary: "Public: Get an article by ID" })
  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.articleService.findOne(id);
  }

  @ApiOperation({ summary: "Admin: Update an article" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdateHelpCenterArticleDto,
  ) {
    return this.articleService.update(id, updateDto);
  }

  @ApiOperation({ summary: "Admin: Delete an article" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.articleService.remove(id);
  }
}
