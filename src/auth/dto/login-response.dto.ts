import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  refreshToken: string;

  @ApiProperty({ example: "John Doe" })
  name: string;

  @ApiProperty({ example: "Business" })
  role: string;

  @ApiProperty({ example: true, required: false })
  isOnboarded?: boolean;
}
