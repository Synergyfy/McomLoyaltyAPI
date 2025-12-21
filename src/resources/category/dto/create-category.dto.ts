import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({
    description: "The name of the category",
    example: "Clothing",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The ID of the sector this category belongs to",
    example: "cll6z4q4y0000_1_2_3_4",
  })
  @IsString()
  @IsNotEmpty()
  sectorId: string;

  @ApiProperty({
    description: "The URL of the category image",
    example: "https://example.com/clothing.png",
    required: false,
  })
  @IsUrl()
  imageUrl?: string;
}
