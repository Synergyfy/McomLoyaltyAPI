import { ApiProperty } from '@nestjs/swagger';
import { PointHistoryType } from '../../participant-campaign-balance/entities/point-history.entity';

export class CustomerActivityResponseDto {
    @ApiProperty({ example: 'John Doe' })
    participantName: string;

    @ApiProperty({ enum: PointHistoryType, example: PointHistoryType.EARN })
    activityType: PointHistoryType;

    @ApiProperty({ example: 'Earned 50 points' })
    details: string;

    @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
    date: Date;

    @ApiProperty({ example: 'Summer Sale' })
    campaignName: string;
}

export class PaginatedCustomerActivityResponseDto {
    @ApiProperty({ type: [CustomerActivityResponseDto] })
    data: CustomerActivityResponseDto[];

    @ApiProperty({ example: 10 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;
}
