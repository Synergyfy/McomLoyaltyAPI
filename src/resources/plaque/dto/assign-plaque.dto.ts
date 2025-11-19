import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PlaqueRole } from '../entities/enums/plaque-role.enum';
import { PreferredPayoutMethod } from '../entities/enums/preferred-payout-method.enum';

export class AssignPlaqueDto {
  @IsNotEmpty()
  @IsString()
  partner_business_name: string;

  @IsNotEmpty()
  @IsString()
  partner_contact_name: string;

  @IsNotEmpty()
  @IsEmail()
  partner_contact_email: string;

  @IsOptional()
  @IsString()
  partner_contact_phone?: string;

  @IsNotEmpty()
  @IsString()
  partner_location_address: string;

  @IsNotEmpty()
  @IsEnum(PlaqueRole)
  plaque_role: PlaqueRole;

  @IsOptional()
  @IsUUID()
  partner_business_id?: string;

  @IsOptional()
  @IsString()
  partner_website?: string;

  @IsOptional()
  @IsString()
  partner_vat_number?: string;

  @IsOptional()
  @IsString()
  partner_category?: string;

  @IsOptional()
  @IsEnum(PreferredPayoutMethod)
  preferred_payout_method?: PreferredPayoutMethod;

  @IsOptional()
  @IsString()
  agreement_terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
