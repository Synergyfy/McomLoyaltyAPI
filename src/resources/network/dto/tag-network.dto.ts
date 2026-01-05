import { IsEnum, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";

export class TagNetworkDto {
  @ApiPropertyOptional({
    enum: NetworkLocationTag,
    description: "Location tag",
  })
  @IsOptional()
  @IsEnum(NetworkLocationTag)
  locationTag?: NetworkLocationTag;

  @ApiPropertyOptional({
    enum: NetworkRelationshipTag,
    description: "Relationship tag",
  })
  @IsOptional()
  @IsEnum(NetworkRelationshipTag)
  relationshipTag?: NetworkRelationshipTag;
}
