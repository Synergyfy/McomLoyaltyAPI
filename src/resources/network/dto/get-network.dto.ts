import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsIn } from "class-validator";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";
import { NetworkStatus } from "../entities/network.entity";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class GetNetworkDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Search query for name, email, or phone",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by business ID" })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ enum: NetworkStatus })
  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: ["createdAt", "fullName", "email"],
  })
  @IsOptional()
  @IsIn(["createdAt", "fullName", "email", "updatedAt"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "Sort order", enum: ["ASC", "DESC"] })
  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}
