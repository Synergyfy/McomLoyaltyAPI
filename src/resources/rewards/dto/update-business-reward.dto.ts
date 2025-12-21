import { PartialType } from "@nestjs/swagger";
import { CreateBusinessRewardDto } from "./create-business-reward.dto";

export class UpdateBusinessRewardDto extends PartialType(
  CreateBusinessRewardDto,
) {}
