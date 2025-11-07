import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class AwardPointDto {
  @IsString()
  @IsNotEmpty()
  @Length(9, 9)
  code: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  points: number;

  @IsString()
  @IsNotEmpty()
  campaignId: string;
}
