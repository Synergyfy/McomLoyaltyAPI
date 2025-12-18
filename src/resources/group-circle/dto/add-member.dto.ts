import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupCircleRole } from '../enums/group-circle.enums';

export class AddMemberDto {
    @ApiProperty()
    @IsUUID()
    networkId: string;

    @ApiProperty({ enum: GroupCircleRole, required: false })
    @IsEnum(GroupCircleRole)
    @IsOptional()
    role?: GroupCircleRole;
}
