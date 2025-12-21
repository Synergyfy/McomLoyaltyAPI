import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateSectorDto {
  @ApiProperty({
    description: "The name of the sector",
    example: "Fashion",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The URL of the sector image",
    example: "https://example.com/fashion.png",
    required: false,
  })
  // @IsString()
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
