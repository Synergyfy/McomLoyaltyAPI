import { ApiProperty } from "@nestjs/swagger";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";

class ActiveCampaign {
  @ApiProperty({ example: "Summer Sale Campaign" })
  name: string;

  @ApiProperty({ example: 120 })
  customerCount: number;
}

export class GeneralAnalyticsDto {
  @ApiProperty({ example: 500 })
  totalCustomers: number;

  @ApiProperty({ example: 10 })
  totalCampaigns: number;

  @ApiProperty({ example: 5 })
  totalActiveCampaigns: number;

  @ApiProperty({ example: 150 })
  totalRewardsRedeemed: number;

  @ApiProperty({ example: 10000 })
  totalPointsEarned: number;

  @ApiProperty({ example: 5000 })
  totalPointsRedeemed: number;

  @ApiProperty({ type: [ActiveCampaign] })
  activeCampaigns: ActiveCampaign[];

  @ApiProperty({ type: [PointHistory] })
  lastTenActivities: PointHistory[];
}
