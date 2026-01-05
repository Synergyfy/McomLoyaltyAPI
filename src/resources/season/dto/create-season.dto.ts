import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsHexColor,
} from "class-validator";

export class CreateSeasonDto {
  @ApiProperty({
    description: "The name of the season",
    example: "Summer 2025",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Start date of the season",
    example: "2025-06-01T00:00:00Z",
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "End date of the season",
    example: "2025-08-31T00:00:00Z",
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: "Description of the season",
    example: "Hot summer deals and seasonal perks",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Text color for the season UI elements (Hex code)",
    example: "#FFFFFF",
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @ApiProperty({
    description: "Background color for the season UI elements (Hex code)",
    example: "#FF5733",
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  bgColor?: string;

  @ApiProperty({
    description: "Border color for the season UI elements (Hex code)",
    example: "#C70039",
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  borderColor?: string;
}
