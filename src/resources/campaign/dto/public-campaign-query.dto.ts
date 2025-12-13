import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PublicCampaignQueryDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by Sector ID' })
    @IsOptional()
    @IsUUID()
    sectorId?: string;

    @ApiPropertyOptional({ description: 'Filter by Category ID' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by SubCategory ID' })
    @IsOptional()
    @IsUUID()
    subCategoryId?: string;

    @ApiPropertyOptional({ description: 'Search by campaign name' })
    @IsOptional()
    @IsString()
    search?: string;
}
