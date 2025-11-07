import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class AwardPointDto {
  @ApiProperty({
    description: 'The 9-character unique code of the participant or a generated code.',
    example: 'aBcDeFgHi',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9)
  code: string;

  @ApiProperty({
    description: 'The number of points to award. Must be greater than 0.',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'The ID of the campaign the points are being awarded for.',
    example: 'b1a2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;
}
