import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";

export class CreateNetworkDto {
  @ApiProperty({ description: "Full name of the contact" })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: "Business name" })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: "Email address" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "Phone number" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    description: "Permission to share information",
    default: false,
  })
  @IsOptional()
  hasPermission?: boolean;

  @ApiPropertyOptional({
    description: "Location tag for the network contact",
    enum: NetworkLocationTag,
  })
  @IsOptional()
  @IsEnum(NetworkLocationTag)
  locationTag?: NetworkLocationTag;

  @ApiPropertyOptional({
    description: "Relationship tag for the network contact",
    enum: NetworkRelationshipTag,
  })
  @IsOptional()
  @IsEnum(NetworkRelationshipTag)
  relationshipTag?: NetworkRelationshipTag;
}
