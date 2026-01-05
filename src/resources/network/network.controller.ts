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
} from "@nestjs/common";
import { NetworkService } from "./network.service";
import { CreateNetworkDto } from "./dto/create-network.dto";
import { BulkImportNetworkDto } from "./dto/bulk-import-network.dto";
import { GetNetworkDto } from "./dto/get-network.dto";
import { UpdateNetworkDto } from "./dto/update-network.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Role } from "../../common/role.enum";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Business } from "../business/entities/business.entity";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { NetworkOnboardingDto } from "./dto/network-onboarding.dto";
import { TagNetworkDto } from "./dto/tag-network.dto";

@ApiTags("Network")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("network")
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Public()
  @Get("onboarding-details/:id")
  @ApiOperation({ summary: "Get pre-filled details for contact onboarding" })
  @ApiResponse({ status: 200, description: "Details returned successfully." })
  @ApiResponse({ status: 404, description: "Contact not found." })
  getOnboardingDetails(@Param("id") id: string) {
    return this.networkService.getOnboardingDetails(id);
  }

  @Public()
  @Post("onboard/:id")
  @ApiOperation({
    summary: "Onboard a network contact as a partner or business",
  })
  @ApiResponse({ status: 201, description: "Onboarded successfully." })
  @ApiResponse({
    status: 400,
    description: "Invalid data or already onboarded.",
  })
  onboard(
    @Param("id") id: string,
    @Body(new ValidationPipe()) dto: NetworkOnboardingDto,
  ) {
    return this.networkService.onboard(id, dto);
  }

  @Post("customers")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Add a customer to the network" })
  @ApiResponse({ status: 201, description: "Customer added successfully." })
  addCustomer(
    @Body() createNetworkDto: CreateNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.addCustomer(createNetworkDto, business);
  }

  @Post("customers/bulk")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Bulk import customers" })
  @ApiResponse({ status: 201, description: "Customers imported successfully." })
  bulkImportCustomers(
    @Body() bulkImportDto: BulkImportNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.bulkImportCustomers(bulkImportDto, business);
  }

  @Get("customers")
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({ summary: "Get list of customers" })
  @ApiResponse({ status: 200, type: GetNetworkDto })
  findAllCustomers(
    @Query(new ValidationPipe({ transform: true })) query: GetNetworkDto,
    @CurrentUser() user: any,
  ) {
    const businessId = user.role === Role.Business ? user.id : undefined;
    return this.networkService.findAllCustomers(query, businessId);
  }

  @Post()
  @Roles(Role.Business)
  @ApiOperation({ summary: "Add a single contact to the network" })
  @ApiResponse({ status: 201, description: "Contact added successfully." })
  @ApiResponse({ status: 409, description: "Contact already exists." })
  addNetwork(
    @Body() createNetworkDto: CreateNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.addNetwork(createNetworkDto, business);
  }

  @Post("bulk")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Bulk import contacts to the network" })
  @ApiResponse({ status: 201, description: "Contacts imported successfully." })
  bulkImport(
    @Body() bulkImportDto: BulkImportNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.bulkImport(bulkImportDto, business);
  }

  @Get()
  @Roles(Role.Business, Role.Admin)
  @ApiOperation({ summary: "Get list of network contacts" })
  @ApiResponse({ status: 200, type: GetNetworkDto })
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: GetNetworkDto,
    @CurrentUser() user: any,
  ) {
    const businessId = user.role === Role.Business ? user.id : undefined;
    return this.networkService.findAll(query, businessId);
  }

  @Patch(":id")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Update a network contact" })
  @ApiResponse({ status: 200, description: "Contact updated successfully." })
  @ApiResponse({ status: 404, description: "Contact not found." })
  update(
    @Param("id") id: string,
    @Body() updateNetworkDto: UpdateNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.update(id, updateNetworkDto, business);
  }

  @Delete(":id")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Delete a network contact" })
  @ApiResponse({ status: 200, description: "Contact deleted successfully." })
  @ApiResponse({ status: 404, description: "Contact not found." })
  remove(@Param("id") id: string, @CurrentUser() business: Business) {
    return this.networkService.remove(id, business);
  }

  @Patch("tag/:referredBusinessId")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Tag a referred business in the network" })
  @ApiResponse({ status: 200, description: "Business tagged successfully." })
  @ApiResponse({ status: 404, description: "Network record not found." })
  tagReferredBusiness(
    @Param("referredBusinessId") referredBusinessId: string,
    @Body() tagNetworkDto: TagNetworkDto,
    @CurrentUser() business: Business,
  ) {
    return this.networkService.tagReferredBusiness(
      referredBusinessId,
      tagNetworkDto,
      business,
    );
  }
}
