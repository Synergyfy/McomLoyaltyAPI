import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { GroupCircleService } from './group-circle.service';
import { CreateGroupCircleDto } from './dto/create-group-circle.dto';
import { UpdateGroupCircleDto } from './dto/update-group-circle.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AssignBankerDto } from './dto/assign-banker.dto';
import { SwapDrawDatesDto } from './dto/swap-draw-dates.dto';
import { RecordContributionDto } from './dto/record-contribution.dto';
import { InitiateContributionDto } from './dto/initiate-contribution.dto';
import { VerifyContributionDto } from './dto/verify-contribution.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupCircle } from './entities/group-circle.entity';
import { GroupCircleMember } from './entities/group-circle-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupActivity } from './entities/group-activity.entity';
import { GroupCircleContribution } from './entities/group-circle-contribution.entity';

@ApiTags('Group Circles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group-circles')
export class GroupCircleController {
    constructor(private readonly service: GroupCircleService) { }

    @Post()
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Create a new Group Circle' })
    @ApiResponse({ status: 201, description: 'Group Circle created.', type: GroupCircle })
    create(@Body() dto: CreateGroupCircleDto, @CurrentUser() business: Business) {
        return this.service.create(dto, business);
    }

    @Get()
    @Roles(Role.Business)
    @ApiOperation({ summary: 'List all Group Circles' })
    @ApiResponse({ status: 200, description: 'List of Group Circles.', type: [GroupCircle] })
    findAll(@Query(new ValidationPipe({ transform: true })) query: PaginationDto, @CurrentUser() business: Business) {
        return this.service.findAll(query, business.id);
    }

    @Get(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get details of a Group Circle' })
    @ApiResponse({ status: 200, description: 'Group Circle details.', type: GroupCircle })
    findOne(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.findOne(id, business.id);
    }

    @Patch(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Update Group Circle' })
    @ApiResponse({ status: 200, description: 'Group Circle updated.', type: GroupCircle })
    update(@Param('id') id: string, @Body() dto: UpdateGroupCircleDto, @CurrentUser() business: Business) {
        return this.service.update(id, dto, business.id);
    }

    @Post(':id/assign-banker')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Assign a member as Banker' })
    @ApiResponse({ status: 200, description: 'Banker assigned.', type: GroupCircleMember })
    assignBanker(@Param('id') id: string, @Body() dto: AssignBankerDto, @CurrentUser() business: Business) {
        return this.service.assignBanker(id, dto, business.id);
    }

    @Post(':id/swap-draw-dates')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Swap draw dates between two members' })
    @ApiResponse({ status: 200, description: 'Draw dates swapped.', schema: { example: { message: 'Draw dates swapped' } } })
    swapDrawDates(@Param('id') id: string, @Body() dto: SwapDrawDatesDto, @CurrentUser() business: Business) {
        return this.service.swapDrawDates(id, dto, business.id);
    }

    @Post(':id/contributions')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Record a contribution (Smart Money)' })
    @ApiResponse({ status: 201, description: 'Contribution recorded.', type: GroupCircleContribution })
    recordContribution(@Param('id') id: string, @Body() dto: RecordContributionDto, @CurrentUser() business: Business) {
        return this.service.recordContribution(id, dto, business.id);
    }

    @Get('contributions')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get all contributions across all circles' })
    @ApiResponse({ status: 200, description: 'List of all contributions.' })
    getAllContributions(@Query(new ValidationPipe({ transform: true })) query: PaginationDto, @CurrentUser() business: Business) {
        return this.service.getAllContributions(business.id, query.page, query.limit);
    }

    @Get(':id/contributions')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get contributions list' })
    @ApiResponse({ status: 200, description: 'List of contributions.', type: [GroupCircleContribution] })
    getContributions(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.getContributions(id, business.id);
    }

    @Post(':id/contributions/initiate')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Initiate a contribution payment' })
    @ApiResponse({ status: 200, description: 'Payment initiated.', schema: { example: { clientSecret: '...', orderId: '...' } } })
    initiateContribution(@Param('id') id: string, @Body() dto: InitiateContributionDto, @CurrentUser() business: Business) {
        return this.service.initiateContribution(id, dto, business.id);
    }

    @Post(':id/contributions/verify')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Verify and record a contribution payment' })
    @ApiResponse({ status: 201, description: 'Payment verified and recorded.', type: GroupCircleContribution })
    verifyContribution(@Param('id') id: string, @Body() dto: VerifyContributionDto, @CurrentUser() business: Business) {
        return this.service.verifyContribution(id, dto, business.id);
    }

    @Post(':id/members')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Add a member to the circle' })
    @ApiResponse({ status: 201, description: 'Member added.', type: GroupCircleMember })
    addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() business: Business) {
        return this.service.addMember(id, dto, business.id);
    }

    @Delete(':id/members/:memberId')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Remove a member from the circle' })
    @ApiResponse({ status: 200, description: 'Member removed.' })
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() business: Business) {
        return this.service.removeMember(id, memberId, business.id);
    }

    @Post(':id/messages')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Send a message to the circle' })
    @ApiResponse({ status: 201, description: 'Message sent.', type: GroupMessage })
    sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser() business: Business) {
        return this.service.sendMessage(id, dto, business);
    }

    @Get(':id/messages')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get messages from the circle' })
    @ApiResponse({ status: 200, description: 'List of messages.', type: [GroupMessage] })
    getMessages(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.getMessages(id, business.id);
    }

    @Get(':id/activities')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get activity log' })
    @ApiResponse({ status: 200, description: 'Activity log.', type: [GroupActivity] })
    getActivities(@Param('id') id: string, @CurrentUser() business: Business) {
        return this.service.getActivities(id, business.id);
    }
}
