
import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectorDto {
  @ApiProperty({ description: 'The name of the sector.', example: 'Restaurants' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'A URL for an image representing the sector.', required: false, example: 'https://example.com/images/restaurants.png' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
