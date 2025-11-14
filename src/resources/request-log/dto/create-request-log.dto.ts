import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestLogDto {
  @ApiProperty({ example: '127.0.0.1' })
  ip: string;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  })
  userAgent: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: '/api/v1/users' })
  originalUrl: string;
}
