
import { IsOptional, IsString } from 'class-validator';

export class UpdateSectorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
