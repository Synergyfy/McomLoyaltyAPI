import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyPointsDto {
    @ApiProperty({ description: 'Number of points to purchase', example: 100 })
    @IsNumber()
    @Min(1)
    points: number;

    @ApiProperty({ description: 'Payment method ID or token', example: 'pm_card_visa' })
    @IsString()
    @IsNotEmpty()
    paymentMethod: string;
}
