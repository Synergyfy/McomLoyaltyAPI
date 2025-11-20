import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ReputationType } from '../entities/reputation-type.enum';

export class ManualOverrideDto {
  @ApiProperty({ description: 'The ID of the user (Business or Participant)' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: ReputationType, description: 'The type of user' })
  @IsEnum(ReputationType)
  @IsNotEmpty()
  userType: ReputationType;

  @ApiProperty({ description: 'The ID of the new reputation level' })
  @IsUUID()
  @IsNotEmpty()
  levelId: string;

  @ApiProperty({ description: 'Reason for the override' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
