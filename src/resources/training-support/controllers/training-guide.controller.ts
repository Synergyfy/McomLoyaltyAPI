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
import { TrainingGuideService } from "../services/training-guide.service";
import {
  CreateTrainingGuideDto,
  UpdateTrainingGuideDto,
  FilterTrainingGuideDto,
} from "../dto/training-guide.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { Public } from "../../../common/decorators/public.decorator";

@ApiTags("training-guides")
@Controller("training-guides")
export class TrainingGuideController {
  constructor(private readonly guideService: TrainingGuideService) {}

  @ApiOperation({ summary: "Admin: Create a training guide" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() createDto: CreateTrainingGuideDto) {
    return this.guideService.create(createDto);
  }

  @ApiOperation({ summary: "Public: Get all training guides (Paginated)" })
  @Public()
  @Get()
  findAll(@Query() filterDto: FilterTrainingGuideDto) {
    return this.guideService.findAll(filterDto);
  }

  @ApiOperation({ summary: "Public: Get a training guide by ID" })
  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.guideService.findOne(id);
  }

  @ApiOperation({ summary: "Admin: Update a training guide" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateTrainingGuideDto) {
    return this.guideService.update(id, updateDto);
  }

  @ApiOperation({ summary: "Admin: Delete a training guide" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guideService.remove(id);
  }
}
