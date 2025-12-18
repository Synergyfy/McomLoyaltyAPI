import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;
}
