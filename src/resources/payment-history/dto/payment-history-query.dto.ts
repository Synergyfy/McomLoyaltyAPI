import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import {
  PaymentProvider,
  PaymentStatus,
  PurchaseType,
} from "../entities/payment-history.entity";

export class PaymentHistoryQueryDto extends PaginationDto {
  @ApiProperty({
    required: false,
    description: "Search by transaction ID, business name, or email",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ required: false, enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  payment_provider?: PaymentProvider;

  @ApiProperty({ required: false, description: "User type" })
  @IsOptional()
  @IsString()
  user_type?: string;

  @ApiProperty({ required: false, enum: PurchaseType })
  @IsOptional()
  @IsEnum(PurchaseType)
  purchase_type?: PurchaseType;

  @ApiProperty({ required: false, description: "Minimum amount" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_amount?: number;

  @ApiProperty({ required: false, description: "Maximum amount" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_amount?: number;

  @ApiProperty({
    required: false,
    enum: ["ASC", "DESC"],
    description: "Sort by creation date",
  })
  @IsOptional()
  @IsString()
  sort?: "ASC" | "DESC";
}
