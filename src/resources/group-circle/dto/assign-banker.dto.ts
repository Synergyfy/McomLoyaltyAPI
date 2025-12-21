import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignBankerDto {
  @ApiProperty({
    description: "The Member ID (GroupCircleMember ID) to become the banker",
  })
  @IsUUID()
  memberId: string;
}
