import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { NetworkService } from './network.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { BulkImportNetworkDto } from './dto/bulk-import-network.dto';
import { GetNetworkDto } from './dto/get-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { CreateNetworkListDto } from './dto/create-network-list.dto';
import { UpdateNetworkListDto } from './dto/update-network-list.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Business } from '../business/entities/business.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Network')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('network')
export class NetworkController {
    constructor(private readonly networkService: NetworkService) { }

    @Post()
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Add a single contact to the network' })
    @ApiResponse({ status: 201, description: 'Contact added successfully.' })
    @ApiResponse({ status: 409, description: 'Contact already exists.' })
    addNetwork(
        @Body() createNetworkDto: CreateNetworkDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.addNetwork(createNetworkDto, business);
    }

    @Post('bulk')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Bulk import contacts to the network' })
    @ApiResponse({ status: 201, description: 'Contacts imported successfully.' })
    bulkImport(
        @Body() bulkImportDto: BulkImportNetworkDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.bulkImport(bulkImportDto, business);
    }

    @Get()
    @Roles(Role.Business, Role.Admin)
    @ApiOperation({ summary: 'Get list of network contacts' })
    @ApiResponse({ status: 200, type: GetNetworkDto })
    findAll(
        @Query(new ValidationPipe({ transform: true })) query: GetNetworkDto,
        @CurrentUser() user: any,
    ) {
        const businessId = user.role === Role.Business ? user.id : undefined;
        return this.networkService.findAll(query, businessId);
    }

    @Patch(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Update a network contact' })
    @ApiResponse({ status: 200, description: 'Contact updated successfully.' })
    @ApiResponse({ status: 404, description: 'Contact not found.' })
    update(
        @Param('id') id: string,
        @Body() updateNetworkDto: UpdateNetworkDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.update(id, updateNetworkDto, business);
    }

    @Delete(':id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Delete a network contact' })
    @ApiResponse({ status: 200, description: 'Contact deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Contact not found.' })
    remove(
        @Param('id') id: string,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.remove(id, business);
    }

    @Post('lists')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Create a new network list' })
    @ApiResponse({ status: 201, description: 'List created successfully.' })
    createList(
        @Body() createNetworkListDto: CreateNetworkListDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.createList(createNetworkListDto, business);
    }

    @Get('lists')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get all network lists' })
    @ApiResponse({ status: 200, description: 'Return all network lists.' })
    findAllLists(
        @Query(new ValidationPipe({ transform: true })) query: PaginationDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.findAllLists(query, business.id);
    }

    @Get('lists/:id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get a network list by ID' })
    @ApiResponse({ status: 200, description: 'Return network list.' })
    @ApiResponse({ status: 404, description: 'List not found.' })
    findListOne(
        @Param('id') id: string,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.findListOne(id, business.id);
    }

    @Patch('lists/:id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Update a network list' })
    @ApiResponse({ status: 200, description: 'List updated successfully.' })
    updateList(
        @Param('id') id: string,
        @Body() updateNetworkListDto: UpdateNetworkListDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.updateList(id, updateNetworkListDto, business);
    }

    @Delete('lists/:id')
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Delete a network list' })
    @ApiResponse({ status: 200, description: 'List deleted successfully.' })
    deleteList(
        @Param('id') id: string,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.deleteList(id, business);
    }
}
