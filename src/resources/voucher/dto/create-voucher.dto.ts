import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDate,
  Min,
} from 'class-validator';
import { VoucherType } from '../entities/voucher-type.enum';
import { VoucherValueType } from '../entities/voucher-value-type.enum';

export class CreateVoucherDto {
  @ApiProperty({
    enum: VoucherType,
    example: VoucherType.DISCOUNT,
    description: 'The type of the voucher.',
  })
  @IsEnum(VoucherType)
  @IsNotEmpty()
  type: VoucherType;

  @ApiProperty({
    example: '20% Off Any Purchase',
    description: 'The title of the voucher.',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 20.0,
    description: 'The cost or value of the voucher.',
  })
  @IsNumber()
  @Min(0)
  valueCost: number;

  @ApiProperty({
    enum: VoucherValueType,
    example: VoucherValueType.MONETARY,
    description: 'The value type of the voucher (e.g., currency or points).',
  })
  @IsEnum(VoucherValueType)
  @IsNotEmpty()
  valueType: VoucherValueType;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'The expiration date of the voucher.',
  })
  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;

  @ApiProperty({
    example: 100,
    description: 'The total number of vouchers available.',
  })
  @IsNumber()
  @Min(1)
  totalQuantity: number;

  @ApiProperty({
    example: 'Cannot be combined with other offers.',
    description: 'The rules for redeeming the voucher.',
  })
  @IsString()
  @IsNotEmpty()
  redemptionRules: string;
}
