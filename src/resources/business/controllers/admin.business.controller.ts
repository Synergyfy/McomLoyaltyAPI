import { Controller, Get, Query, Param, Delete, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { BusinessService } from '../services/business.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Business } from '../entities/business.entity';
import { StaffService } from '../../staff/services/staff.service';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { UpdateStaffDto } from '../../staff/dto/update-staff.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller('admin/businesses')
export class AdminBusinessController {
    constructor(
        private readonly businessService: BusinessService,
        private readonly staffService: StaffService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all businesses (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'A paginated list of all businesses.',
        type: [Business],
    })
    async findAll(@Query() paginationDto: PaginationDto) {
        return this.businessService.findAll(paginationDto.page, paginationDto.limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single business by ID (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'The business with the specified ID.',
        type: Business,
    })
    @ApiResponse({ status: 404, description: 'Business not found.' })
    async findOne(@Param('id') id: string) {
        return this.businessService.findById(id, ['rewards', 'campaigns']);
    }

    @Get(':id/staffs')
    @ApiOperation({ summary: 'Get all staff for a business (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'A paginated list of all staff for a business.',
        type: [Business],
    })
    async findStaff(
        @Param('id') id: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.staffService.findAll(id, paginationDto.page, paginationDto.limit);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a business (admin only)' })
    @ApiResponse({ status: 204, description: 'The business has been successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Business not found.' })
    async remove(@Param('id') id: string) {
        return this.businessService.delete(id);
    }

    @Patch(':id/disable')
    @ApiOperation({ summary: 'Disable a business (admin only)' })
    @ApiResponse({ status: 200, description: 'The business has been successfully disabled.' })
    @ApiResponse({ status: 404, description: 'Business not found.' })
    async disable(@Param('id') id: string) {
        return this.businessService.update(id, { isDisabled: true });
    }

    @Get(':id/participants')
    @ApiOperation({ summary: "Get all participants for a business's campaigns (admin only)" })
    @ApiResponse({
        status: 200,
        description: 'A paginated list of all participants for a business.',
        type: [Business],
    })
    async findAllParticipants(
        @Param('id') id: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.businessService.findAllParticipants(id, paginationDto.page, paginationDto.limit);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a business (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'The business has been successfully updated.',
        type: Business,
    })
    @ApiResponse({ status: 404, description: 'Business not found.' })
    async update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
        return this.businessService.update(id, updateBusinessDto);
    }

    @Patch('staffs/:id')
    @ApiOperation({ summary: 'Update a staff member (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'The staff member has been successfully updated.',
        type: Business,
    })
    @ApiResponse({ status: 404, description: 'Staff member not found.' })
    async updateStaff(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
        return this.staffService.update(id, updateStaffDto);
    }
}