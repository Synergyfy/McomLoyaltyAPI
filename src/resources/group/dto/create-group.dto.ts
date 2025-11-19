import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  group_name: string;

  @IsOptional()
  @IsString()
  group_description?: string;
}
