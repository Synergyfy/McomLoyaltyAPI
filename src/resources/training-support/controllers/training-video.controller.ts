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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TrainingVideoService } from "../services/training-video.service";
import {
  CreateTrainingVideoDto,
  UpdateTrainingVideoDto,
  FilterTrainingVideoDto,
} from "../dto/training-video.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { Public } from "../../../common/decorators/public.decorator";

@ApiTags("training-videos")
@Controller("training-videos")
export class TrainingVideoController {
  constructor(private readonly trainingVideoService: TrainingVideoService) {}

  @ApiOperation({ summary: "Admin: Create a training video" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Post()
  create(@Body() createDto: CreateTrainingVideoDto) {
    return this.trainingVideoService.create(createDto);
  }

  @ApiOperation({ summary: "Public: Get all training videos (Paginated)" })
  @Public()
  @Get()
  findAll(@Query() filterDto: FilterTrainingVideoDto) {
    return this.trainingVideoService.findAll(filterDto);
  }

  @ApiOperation({ summary: "Public: Get a training video by ID" })
  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.trainingVideoService.findOne(id);
  }

  @ApiOperation({ summary: "Admin: Update a training video" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateTrainingVideoDto) {
    return this.trainingVideoService.update(id, updateDto);
  }

  @ApiOperation({ summary: "Admin: Delete a training video" })
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.trainingVideoService.remove(id);
  }
}
