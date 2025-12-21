import { IsString, IsNumber, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AwardStampsDto {
  @ApiProperty({
    description: "The ID of the staff member awarding the stamps",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({
    description: "The ID of the participant receiving the stamps",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0852",
  })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({
    description: "The ID of the campaign the stamps are being awarded for",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0853",
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({
    description: "The number of stamps to award",
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  stamps?: number;
}
