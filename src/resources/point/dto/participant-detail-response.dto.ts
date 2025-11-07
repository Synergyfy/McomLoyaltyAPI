import { ApiProperty } from '@nestjs/swagger';
import { PointHistory } from '../entities/point-history.entity';

export class ParticipantDetailResponseDto {
  @ApiProperty({
    description: "The participant's point balance. Can be total or campaign-specific.",
    example: 500,
  })
  balance: number;

  @ApiProperty({
    description: "The participant's point history. Can be total or campaign-specific.",
    type: () => [PointHistory],
  })
  history: PointHistory[];
}
