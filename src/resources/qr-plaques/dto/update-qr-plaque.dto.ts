import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { CreateQrPlaqueDto } from "./create-qr-plaque.dto";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from "class-validator";
import { QrPlaqueStatus } from "../entities/qr-plaque.entity";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";

export class UpdateQrPlaqueDto extends PartialType(CreateQrPlaqueDto) {
  @ApiProperty({
    description: "Status of the plaque",
    enum: QrPlaqueStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(QrPlaqueStatus)
  status?: QrPlaqueStatus;

  @ApiProperty({
    description: "URL of the generated QR code image (Admin only)",
    example: "https://storage.googleapis.com/bucket/qr-code.png",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  qrCodeUrl?: string;

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
    description: "ID of the business to assign (usually set by system)",
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
    description: "Relationship tag for the network contact",
    enum: NetworkRelationshipTag,
    required: false,
  })
  @IsOptional()
  @IsEnum(NetworkRelationshipTag)
  relationshipTag?: NetworkRelationshipTag;
}
