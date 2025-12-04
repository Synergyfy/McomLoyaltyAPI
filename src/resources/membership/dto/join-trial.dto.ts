import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinTrialDto {
    @ApiProperty({ description: 'The ID of the tier to join as a trial' })
    @IsNotEmpty()
    @IsString()
    tier_id: string;
}
