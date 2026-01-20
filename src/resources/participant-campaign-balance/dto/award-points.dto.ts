import { IsString, IsNumber, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AwardPointsDto {
  @ApiProperty({
    description: "The ID of the staff member awarding the points",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({
    description: "The ID of the participant receiving the points",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0852",
  })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({
    description: "The ID of the campaign the points are being awarded for",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0853",
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({
    description: "The number of points to award",
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  points: number;

  @ApiProperty({
    description:
      "Unique key to ensure idempotency (prevent duplicates on retry)",
    required: false,
    example: "uuid-v4-string",
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
