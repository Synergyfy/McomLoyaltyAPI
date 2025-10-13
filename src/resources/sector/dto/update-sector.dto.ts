
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSectorDto {
  @ApiProperty({ description: 'The new name of the sector.', required: false, example: 'Fine Dining' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'A new URL for the sector image.', required: false, example: 'https://example.com/images/fine-dining.png' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
