import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendMessageDto {
  @ApiProperty({ description: "Message content" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: "ID of the recipient member for Direct Messages (optional)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiProperty({
    description: "ID of the sender (optional, defaults to authenticated user)",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  senderId?: string;
}
