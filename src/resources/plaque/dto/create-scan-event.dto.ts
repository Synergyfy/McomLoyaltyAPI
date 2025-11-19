import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateScanEventDto {
  @IsNotEmpty()
  @IsString()
  plaque_id: string;

  @IsOptional()
  @IsObject()
  scanner_info?: Record<string, any>;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsObject()
  entry_params?: Record<string, any>;
}
