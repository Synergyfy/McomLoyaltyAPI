import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateNetworkDto } from "./create-network.dto";

export class BulkImportNetworkDto {
  @ApiProperty({ type: [CreateNetworkDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNetworkDto)
  networks: CreateNetworkDto[];

  @ApiProperty({
    description: "Permission to share information for all contacts",
    default: false,
  })
  @IsOptional()
  hasPermission?: boolean;
}
