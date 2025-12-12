import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { NetworkLocationTag, NetworkRelationshipTag, NetworkStatus } from '../entities/network.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetNetworkDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Search query for name, email, or phone' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: NetworkLocationTag })
    @IsOptional()
    @IsEnum(NetworkLocationTag)
    locationTag?: NetworkLocationTag;

    @ApiPropertyOptional({ enum: NetworkRelationshipTag })
    @IsOptional()
    @IsEnum(NetworkRelationshipTag)
    relationshipTag?: NetworkRelationshipTag;

    @ApiPropertyOptional({ enum: NetworkStatus })
    @IsOptional()
    @IsEnum(NetworkStatus)
    status?: NetworkStatus;

    @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'fullName', 'email'] })
    @IsOptional()
    @IsIn(['createdAt', 'fullName', 'email', 'updatedAt'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
