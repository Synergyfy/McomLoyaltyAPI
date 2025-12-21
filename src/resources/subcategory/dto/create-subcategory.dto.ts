import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateSubcategoryDto {
  @ApiProperty({
    description: "The name of the subcategory",
    example: "T-Shirts",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The ID of the category this subcategory belongs to",
    example: "cll6z4q4y0000_1_2_3_4",
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: "The URL of the subcategory image",
    example: "https://example.com/t-shirts.png",
    required: false,
  })
  @IsUrl()
  imageUrl?: string;
}
