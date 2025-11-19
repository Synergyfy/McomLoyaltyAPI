import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { GroupMemberRole } from '../entities/enums/group-member-role.enum';

export class InvitePartnerDto {
  @IsNotEmpty()
  @IsEmail()
  partner_email: string;

  @IsNotEmpty()
  @IsEnum(GroupMemberRole)
  role: GroupMemberRole;
}
