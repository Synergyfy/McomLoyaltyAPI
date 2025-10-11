
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
