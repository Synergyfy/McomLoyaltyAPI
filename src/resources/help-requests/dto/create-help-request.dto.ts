import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HelpRequestType } from '../entities/help-request.entity';

export class CreateHelpRequestDto {
  @ApiProperty({ 
    enum: HelpRequestType, 
    description: 'The category of help required.',
    example: HelpRequestType.CAMPAIGN_CREATION 
  })
  @IsEnum(HelpRequestType)
  @IsNotEmpty()
  type: HelpRequestType;

  @ApiProperty({ 
    description: 'A brief summary of the request.',
    example: 'Need help with X-Mas Campaign' 
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: 'A detailed explanation of what assistance is needed. You can include specific requirements, dates, or questions.',
    example: 'I need to set up a campaign that runs from Dec 20 to Dec 25. It should offer double points on all coffee purchases. Please check my tier settings as well.' 
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
