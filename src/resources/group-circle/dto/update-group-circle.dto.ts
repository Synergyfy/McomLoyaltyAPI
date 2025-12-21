import { PartialType } from "@nestjs/swagger";
import { CreateGroupCircleDto } from "./create-group-circle.dto";

export class UpdateGroupCircleDto extends PartialType(CreateGroupCircleDto) {}
