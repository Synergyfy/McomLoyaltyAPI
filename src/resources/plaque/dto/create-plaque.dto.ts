import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePlaqueDto {
  @IsNotEmpty()
  @IsUUID()
  group_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
