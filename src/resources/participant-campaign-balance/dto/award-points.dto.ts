import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class AwardPointsDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  participantId: string;

  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsNumber()
  @IsNotEmpty()
  points: number;
}