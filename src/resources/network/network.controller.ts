import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { NetworkService } from './network.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { BulkImportNetworkDto } from './dto/bulk-import-network.dto';
import { GetNetworkDto } from './dto/get-network.dto';
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
    @Roles(Role.Business)
    @ApiOperation({ summary: 'Get list of network contacts' })
    @ApiResponse({ status: 200, type: GetNetworkDto }) // Note: Returns paginated response, schema might be dynamic
    findAll(
        @Query(new ValidationPipe({ transform: true })) query: GetNetworkDto,
        @CurrentUser() business: Business,
    ) {
        return this.networkService.findAll(query, business);
    }
}
