import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { StampPackageService } from "../services/stamp-package.service";
import { CreateStampPackageDto } from "../dto/create-stamp-package.dto";
import { UpdateStampPackageDto } from "../dto/update-stamp-package.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/role.enum";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

@ApiTags("Stamp Packages")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("stamp-packages")
export class StampPackageController {
  constructor(private readonly stampPackageService: StampPackageService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Admin: Create a stamp package" })
  create(@Body() dto: CreateStampPackageDto) {
    return this.stampPackageService.create(dto);
  }

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Admin: Get all stamp packages" })
  findAll(@Query() pagination: PaginationDto) {
    return this.stampPackageService.findAll(
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Get("available")
  @Roles(Role.Business)
  @ApiOperation({
    summary: "Business: Get available stamp packages for my tier",
  })
  getAvailable(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    // Assuming user.tier.id is available. If not, we might need to fetch business tier.
    // For now, let's assume we fetch the business first.
    return this.stampPackageService.getAvailablePackages(
      user.tierId,
      pagination.page || 1,
      pagination.limit || 10,
    );
  }

  @Post("buy/:packageId")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Business: Initiate stamp package purchase" })
  buy(
    @CurrentUser() user: any,
    @Param("packageId", ParseUUIDPipe) packageId: string,
    @Query("provider") provider: string = "stripe",
  ) {
    return this.stampPackageService.buyPackage(user.id, packageId, provider);
  }

  @Post("confirm-purchase")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Business: Confirm stamp package purchase" })
  confirmPurchase(
    @CurrentUser() user: any,
    @Body("transaction_id") transactionId: string,
    @Query("provider") provider: string = "stripe",
  ) {
    return this.stampPackageService.confirmPurchase(
      user.id,
      transactionId,
      provider,
    );
  }

  @Get("my-packages")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Business: Get my purchased stamp packages" })
  getMyPackages(@CurrentUser() user: any) {
    return this.stampPackageService.getMyPackages(user.id);
  }

  @Get("balance")
  @Roles(Role.Business)
  @ApiOperation({ summary: "Business: Get total stamp balance from packages" })
  getBalance(@CurrentUser() user: any) {
    return this.stampPackageService.getAggregateBalance(user.id);
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Business)
  @ApiOperation({ summary: "Get stamp package details" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.stampPackageService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Admin: Update a stamp package" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStampPackageDto,
  ) {
    return this.stampPackageService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Admin: Delete a stamp package" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.stampPackageService.remove(id);
  }
}
