import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GenerateCodeDto {
  @ApiProperty({
    description: 'The ID of the campaign for which the code is being generated.',
    example: 'b1a2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;
}
