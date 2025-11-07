import { ApiProperty } from '@nestjs/swagger';
import { Participant } from '../../participant/entities/participant.entity';

class ParticipantWithBalance extends Participant {
  @ApiProperty({
    description: "The participant's total point balance across the business's campaigns.",
    example: 500,
  })
  totalPoints: number;
}

export class PaginatedParticipantResponseDto {
  @ApiProperty({
    description: 'A list of participants with their point balances.',
    type: () => [ParticipantWithBalance],
  })
  data: ParticipantWithBalance[];

  @ApiProperty({
    description: 'The total number of participants.',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'The current page number.',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'The number of items per page.',
    example: 10,
  })
  limit: number;
}
