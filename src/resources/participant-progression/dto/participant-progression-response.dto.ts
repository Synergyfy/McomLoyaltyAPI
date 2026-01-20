import { ApiProperty } from "@nestjs/swagger";
import { ParticipantBadge } from "../entities/participant-badge.entity";

export class ParticipantProgressionResponseDto {
  @ApiProperty()
  currentPoints: number;

  @ApiProperty({ type: ParticipantBadge })
  currentBadge: ParticipantBadge;

  @ApiProperty({ type: ParticipantBadge, nullable: true })
  nextBadge: ParticipantBadge | null;

  @ApiProperty()
  pointsNeeded: number;

  @ApiProperty()
  remainingPoints: number;

  @ApiProperty()
  progressPercentage: number;

  @ApiProperty({ type: [ParticipantBadge] })
  allBadges: ParticipantBadge[];
}
