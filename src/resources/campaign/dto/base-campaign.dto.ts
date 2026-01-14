import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsUrl,
  IsOptional,
  IsEnum,
  IsInt,
  IsEmail,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import {
  CampaignType,
  AudienceType,
  CampaignRewardMode,
} from "../entities/campaign-enums";

export class BaseCampaignDto {
  @ApiProperty({ description: "The name of the campaign." })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The type of the campaign.",
    enum: CampaignType,
    default: CampaignType.QR_CODE,
  })
  @IsEnum(CampaignType)
  campaign_type: CampaignType;

  @ApiProperty({ description: "The message for the campaign." })
  @IsString()
  @IsNotEmpty()
  campaign_message: string;

  @ApiProperty({
    description: "The audience type for the campaign.",
    enum: AudienceType,
  })
  @IsEnum(AudienceType)
  audience_type: AudienceType;

  @ApiProperty({
    description: "Points awarded upon sign up.",
    required: false,
  })
  @IsOptional()
  @IsInt()
  signUpPoint?: number;

  @ApiProperty({ description: "The banner URL for the campaign." })
  @IsUrl()
  banner_url: string;

  @ApiProperty({
    description: "The logo URL for the campaign.",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiProperty({
    description: "The mode of reward for the campaign.",
    enum: CampaignRewardMode,
    default: CampaignRewardMode.POINTS,
  })
  @IsEnum(CampaignRewardMode)
  @IsOptional()
  reward_mode: CampaignRewardMode;

  @ApiProperty({
    description: "The threshold for regular points.",
    required: false,
  })
  @IsOptional()
  @IsInt()
  regular_points_threshold?: number;

  @ApiProperty({
    description: "The title of the earn point page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  earn_point_page_title?: string;

  @ApiProperty({
    description: "The description of the earn point page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  earn_point_page_description?: string;

  @ApiProperty({
    description: "The title of the redeem reward page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  redeem_reward_page_title?: string;

  @ApiProperty({
    description: "The description of the redeem reward page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  redeem_reward_page_description?: string;

  @ApiProperty({
    description: "The title of the contact us page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_us_page_title?: string;

  @ApiProperty({
    description: "The description of the contact us page.",
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_us_page_description?: string;

  @ApiProperty({
    description: "The contact email for the campaign.",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({
    description: "The contact phone number for the campaign.",
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_phone_number?: string;

  @ApiProperty({
    description: "The footer text for the campaign.",
    required: false,
  })
  @IsOptional()
  @IsString()
  footer_text?: string;
}
