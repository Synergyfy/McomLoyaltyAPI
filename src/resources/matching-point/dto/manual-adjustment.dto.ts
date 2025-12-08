import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualAdjustmentDto {
    @ApiProperty({ description: 'ID of the business to adjust points for' })
    @IsString()
    @IsNotEmpty()
    businessId: string;

    @ApiProperty({ description: 'Points to add (positive) or subtract (negative)' })
    @IsInt()
    @IsNotEmpty()
    points: number;

    @ApiProperty({ description: 'Reason for the adjustment' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
