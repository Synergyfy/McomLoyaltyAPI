import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsEmail, IsUrl, ValidateIf } from 'class-validator';
import { QrPlaqueStatus } from '../entities/qr-plaque.entity';

export class UpdateQrPlaqueDto {
    @ApiProperty({ description: 'Status of the plaque', enum: QrPlaqueStatus, required: false })
    @IsOptional()
    @IsEnum(QrPlaqueStatus)
    status?: QrPlaqueStatus;

    @ApiProperty({ description: 'ID of the partner assigned to the plaque', required: false })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsUUID()
    assignedPartnerId?: string | null;

    @ApiProperty({ description: 'ID of the business assigned to the plaque', required: false })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsUUID()
    assignedBusinessId?: string | null;

    @ApiProperty({ description: 'Pending invite email', required: false })
    @IsOptional()
    @IsEmail()
    pendingInviteEmail?: string;

    @ApiProperty({ description: 'Pending invite code', required: false })
    @IsOptional()
    @IsString()
    pendingInviteCode?: string;

    @ApiProperty({ description: 'The URL link attached to the plaque', required: false })
    @IsOptional()
    @IsUrl()
    link?: string;
}
