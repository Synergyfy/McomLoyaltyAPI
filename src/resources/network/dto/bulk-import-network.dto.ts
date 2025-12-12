import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNetworkDto } from './create-network.dto';

export class BulkImportNetworkDto {
    @ApiProperty({ type: [CreateNetworkDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateNetworkDto)
    networks: CreateNetworkDto[];
}
