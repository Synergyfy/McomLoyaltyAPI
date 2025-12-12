import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkLocationTag, NetworkRelationshipTag } from '../entities/network.entity';

export class CreateNetworkDto {
    @ApiProperty({ description: 'Full name of the contact' })
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @ApiPropertyOptional({ description: 'Business name' })
    @IsOptional()
    @IsString()
    businessName?: string;

    @ApiPropertyOptional({ description: 'Email address' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'Phone number' })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({ enum: NetworkLocationTag, description: 'Location tag' })
    @IsNotEmpty()
    @IsEnum(NetworkLocationTag)
    locationTag: NetworkLocationTag;

    @ApiProperty({ enum: NetworkRelationshipTag, description: 'Relationship tag' })
    @IsNotEmpty()
    @IsEnum(NetworkRelationshipTag)
    relationshipTag: NetworkRelationshipTag;
}
