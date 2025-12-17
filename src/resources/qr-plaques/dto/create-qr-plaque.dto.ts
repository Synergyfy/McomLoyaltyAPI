import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQrPlaqueDto {
    @ApiProperty({
        description: 'Name of the plaque',
        example: 'Reception Desk Plaque',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'Description of the plaque usage or location',
        example: 'Plaque placed at the main reception desk for customer check-ins.',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: 'Text to display as the call to action',
        example: 'Scan to Check In',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    actionText: string;

    @ApiProperty({
        description: 'Optional footer text',
        example: 'Powered by Mcom',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    footerText?: string;

    @ApiProperty({
        description: 'URL the plaque QR code should redirect to',
        example: 'https://mcomloyalty.com/check-in/123',
    })
    @IsNotEmpty()
    @IsUrl()
    contentUrl: string;
}
