import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export enum PackageType {
  POINT = "POINT",
  STAMP = "STAMP",
}

export class InitiatePackagePurchaseDto {
  @ApiProperty({ description: "The ID of the package (point or stamp)" })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty({ description: "The type of the package", enum: PackageType })
  @IsEnum(PackageType)
  @IsNotEmpty()
  packageType: PackageType;

  @ApiProperty({
    description: "The payment provider (stripe or paypal)",
    example: "stripe",
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: "The amount to pay", example: 10.0 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;
}

export class VerifyPackagePurchaseDto {
  @ApiProperty({ description: "The transaction ID from the provider" })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: "The type of the package", enum: PackageType })
  @IsEnum(PackageType)
  @IsNotEmpty()
  packageType: PackageType;

  @ApiProperty({
    description: "The payment provider (stripe or paypal)",
    example: "stripe",
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
}
