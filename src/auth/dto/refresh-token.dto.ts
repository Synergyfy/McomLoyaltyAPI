import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'your_refresh_token',
  })
  readonly refreshToken: string;
}