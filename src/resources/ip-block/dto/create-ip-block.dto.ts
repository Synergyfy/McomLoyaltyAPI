import { ApiProperty } from '@nestjs/swagger';

export class CreateIpBlockDto {
  @ApiProperty({ example: '127.0.0.1' })
  ip: string;
}
