import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InvitePartnerDto } from './dto/invite-partner.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: User,
  ) {
    return this.groupService.createGroup(createGroupDto, user.id);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  invitePartner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() invitePartnerDto: InvitePartnerDto,
    @CurrentUser() user: User,
  ) {
    return this.groupService.invitePartner(id, invitePartnerDto, user.id);
  }
}
