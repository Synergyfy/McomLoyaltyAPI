import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { QrPlaqueStatus } from "../entities/qr-plaque.entity";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";

export class CreateQrPlaqueDto {
  @ApiProperty({
    description: "Name of the plaque",
    example: "Reception Desk Plaque",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "Description of the plaque usage or location",
    example: "Plaque placed at the main reception desk for customer check-ins.",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Text to display as the call to action",
    example: "Scan to Check In",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  actionText: string;

  @ApiProperty({
    description: "Optional footer text",
    example: "Powered by Mcom",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  footerText?: string;

  @ApiProperty({
    description: "URL the plaque QR code should redirect to",
    example: "https://mcomloyalty.com/check-in/123",
  })
  @IsNotEmpty()
  @IsUrl()
  contentUrl: string;

  @ApiProperty({
    description: "Status of the plaque",
    enum: QrPlaqueStatus,
    required: false,
    default: QrPlaqueStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(QrPlaqueStatus)
  status?: QrPlaqueStatus;

  @ApiProperty({
    description: "Sale price in GBP (if putting up for sale)",
    example: 99.99,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: "ID of the partner to assign as owner",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedPartnerId?: string;

  @ApiProperty({
    description: "ID of the business to assign",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedBusinessId?: string;

  @ApiProperty({
    description: "ID of the network contact to assign to",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  networkContactId?: string;

  @ApiPropertyOptional({
    description: "Location tag for the network contact",
    enum: NetworkLocationTag,
    required: false,
  })
  @IsOptional()
  @IsEnum(NetworkLocationTag)
  locationTag?: NetworkLocationTag;

  @ApiPropertyOptional({
    description: "Relationship tag for the network contact",
    enum: NetworkRelationshipTag,
    required: false,
  })
  @IsOptional()
  @IsEnum(NetworkRelationshipTag)
  relationshipTag?: NetworkRelationshipTag;

  @ApiProperty({
    description:
      "ID of a referred business to assign the plaque to (without transferring ownership)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignToReferredBusinessId?: string;
}
