import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { GroupCircleRole } from "../enums/group-circle.enums";

export class AddMemberDto {
  @ApiProperty({
    description:
      "The network contact ID (required if referredBusinessId not provided)",
    required: false,
  })
  @IsOptional()
  @IsString()
  networkId?: string;

  @ApiProperty({
    description:
      "The referred business ID (required if networkId not provided)",
    required: false,
  })
  @IsOptional()
  @IsString()
  referredBusinessId?: string;

  @ApiProperty({
    enum: GroupCircleRole,
    description: "Role of the member",
    required: false,
    default: GroupCircleRole.PERIPHERAL,
  })
  @IsOptional()
  @IsEnum(GroupCircleRole)
  role?: GroupCircleRole;
}
