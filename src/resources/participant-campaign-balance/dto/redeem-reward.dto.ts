import { IsString, IsNotEmpty } from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  participantId: string;

  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @IsString()
  @IsNotEmpty()
  redemptionCode: string;
}