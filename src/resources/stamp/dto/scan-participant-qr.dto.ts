import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class ScanParticipantQrDto {
  @ApiProperty({ example: 'participant-unique-code' })
  @IsString()
  participantUniqueCode: string;

  @ApiProperty({ example: 'business-stamp-reward-uuid', description: 'The specific stamp reward program to add a stamp to' })
  @IsUUID()
  businessStampRewardId: string;
}
