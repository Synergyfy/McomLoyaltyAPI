import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { GroupCircleService } from './group-circle.service';
import { CreateGroupCircleDto } from './dto/create-group-circle.dto';
import { UpdateGroupCircleDto } from './dto/update-group-circle.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AssignBankerDto } from './dto/assign-banker.dto';
import { SwapDrawDatesDto } from './dto/swap-draw-dates.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Group Circles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group-circles')
export class GroupCircleController {
    constructor(private readonly service: GroupCircleService) {}

    @Post()
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Create a new Group Circle' })
    create(@Body() dto: CreateGroupCircleDto, @CurrentUser() business: Business) {
        return this.service.create(dto, business);
    }

    @Get()
    @Roles(Role.Business)
    @ApiOperation({ summary: 'List all Group Circles' })
    findAll(@Query(new ValidationPipe({ transform: true })) query: PaginationDto, @CurrentUser() business: Business) {
        return this.service.findAll(query, business.id);
    }

    @Get(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get details of a Group Circle' })
    findOne(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.findOne(id, business.id);
    }

    @Patch(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Update Group Circle' })
    update(@Param('id') id: string, @Body() dto: UpdateGroupCircleDto, @CurrentUser() business: Business) {
        return this.service.update(id, dto, business.id);
    }

    @Post(':id/assign-banker')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Assign a member as Banker' })
    assignBanker(@Param('id') id: string, @Body() dto: AssignBankerDto, @CurrentUser() business: Business) {
        return this.service.assignBanker(id, dto, business.id);
    }

    @Post(':id/swap-draw-dates')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Swap draw dates between two members' })
    swapDrawDates(@Param('id') id: string, @Body() dto: SwapDrawDatesDto, @CurrentUser() business: Business) {
        return this.service.swapDrawDates(id, dto, business.id);
    }

    @Post(':id/members')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Add a member to the circle' })
    addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() business: Business) {
        return this.service.addMember(id, dto, business.id);
    }

    @Delete(':id/members/:memberId')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Remove a member from the circle' })
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() business: Business) {
        return this.service.removeMember(id, memberId, business.id);
    }

    @Post(':id/messages')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Send a message to the circle' })
    sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser() business: Business) {
        return this.service.sendMessage(id, dto, business);
    }

    @Get(':id/messages')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get messages from the circle' })
    getMessages(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.getMessages(id, business.id);
    }

    @Get(':id/activities')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get activity log' })
    getActivities(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.getActivities(id, business.id);
    }
}
