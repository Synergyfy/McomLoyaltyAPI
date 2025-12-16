import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RedeemStampCardDto {
  @ApiProperty({ example: 'participant-unique-code' })
  @IsString()
  participantUniqueCode: string;
}
