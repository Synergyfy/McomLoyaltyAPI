import { PartialType } from "@nestjs/swagger";
import { CreateMatchingPointRewardDto } from "./create-matching-point-reward.dto";

export class UpdateMatchingPointRewardDto extends PartialType(
  CreateMatchingPointRewardDto,
) {}
