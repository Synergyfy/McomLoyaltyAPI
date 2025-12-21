import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class ActivateStampRewardDto {
  @ApiProperty({ example: "template-uuid" })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    example: "https://example.com/custom-image.png",
    required: false,
  })
  @IsOptional()
  @IsString()
  custom_image?: string;

  @ApiProperty({ example: "Mon-Fri 9am-5pm", required: false })
  @IsOptional()
  @IsString()
  operating_hours?: string;
}
