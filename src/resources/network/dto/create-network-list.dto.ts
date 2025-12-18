import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NetworkListType, NetworkListGeography, NetworkListStatus } from '../entities/network-list.entity';

export class CreateNetworkListDto {
    @ApiProperty({ description: 'Name of the list', example: 'Summer Campaign Targets' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: NetworkListType, description: 'Type of the list' })
    @IsEnum(NetworkListType)
    type: NetworkListType;

    @ApiProperty({ enum: NetworkListGeography, description: 'Geographical scope' })
    @IsEnum(NetworkListGeography)
    geography: NetworkListGeography;

    @ApiProperty({ enum: NetworkListStatus, description: 'Status', default: NetworkListStatus.ACTIVE, required: false })
    @IsEnum(NetworkListStatus)
    @IsOptional()
    status?: NetworkListStatus;

    @ApiProperty({ description: 'Array of Network IDs to include in the list', required: false, type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    networkIds?: string[];
}
