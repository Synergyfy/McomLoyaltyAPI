import { IsUUID, IsNumber, IsInt, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContributionStatus } from '../entities/group-circle-contribution.entity';

export class RecordContributionDto {
    @ApiProperty()
    @IsUUID()
    memberId: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsInt()
    round: number;

    @ApiProperty({ enum: ContributionStatus, required: false })
    @IsEnum(ContributionStatus)
    @IsOptional()
    status?: ContributionStatus;
}
