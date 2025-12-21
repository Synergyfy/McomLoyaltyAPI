import { ApiProperty } from "@nestjs/swagger";

class CampaignBalanceDto {
  @ApiProperty({
    description: "The ID of the campaign",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0853",
  })
  campaign_id: string;

  @ApiProperty({
    description: "The name of the campaign",
    example: "Summer Sale",
  })
  campaign_name: string;

  @ApiProperty({
    description: "The participant`s point balance for this campaign",
    example: 100,
  })
  balance: number;
}

export class GetParticipantBalanceDto {
  @ApiProperty({
    description: "The participant`s global total point balance",
    example: 1000,
  })
  global_total_points: number;

  @ApiProperty({
    description: "The participant`s point balances for each campaign",
    type: [CampaignBalanceDto],
  })
  campaign_balances: CampaignBalanceDto[];
}
