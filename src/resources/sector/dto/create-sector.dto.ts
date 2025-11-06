
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({
    description: 'The name of the sector',
    example: 'Fashion',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The URL of the sector image',
    example: 'https://example.com/fashion.png',
    required: false,
  })
  imageUrl?: string;
}
