import { ApiProperty } from "@nestjs/swagger";
import { Participant } from "../../participant/entities/participant.entity";

export class CampaignAnalyticsResponseDto {
  @ApiProperty({
    description: "The total number of points earned in the campaign(s).",
    example: 1500,
  })
  totalPointsEarned: number;

  @ApiProperty({
    description:
      "The total number of activities (point transactions) in the campaign(s).",
    example: 75,
  })
  totalActivities: number;

  @ApiProperty({
    description: "A list of participants in the campaign(s).",
    type: () => Participant,
    isArray: true,
  })
  participants: Participant[];
}
