import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { PointPackageService } from "./point-package.service";
import { CreatePointPackageDto } from "./dto/create-point-package.dto";
import { UpdatePointPackageDto } from "./dto/update-point-package.dto";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { ConfirmPointPurchaseDto } from "../business/dto/confirm-point-purchase.dto";
import { ConfirmPurchaseResponseDto } from "./dto/confirm-purchase-response.dto";

import { MembershipService } from "../membership/membership.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Point Packages")
@Controller("point-packages")
export class PointPackageController {
  constructor(
    private readonly pointPackageService: PointPackageService,
    private readonly membershipService: MembershipService,
  ) {}

  @Post("admin")
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new point package (Admin)" })
  create(@Body() createPointPackageDto: CreatePointPackageDto) {
    return this.pointPackageService.create(createPointPackageDto);
  }

  @Get("all")
  @Public()
  @ApiOperation({ summary: "Get all point packages" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  findAll(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.pointPackageService.findAll(page, limit);
  }

  @Get("admin/:id")
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a point package by ID (Admin)" })
  findOne(@Param("id") id: string) {
    return this.pointPackageService.findOne(id);
  }

  @Patch("admin/:id")
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a point package (Admin)" })
  update(
    @Param("id") id: string,
    @Body() updatePointPackageDto: UpdatePointPackageDto,
  ) {
    return this.pointPackageService.update(id, updatePointPackageDto);
  }

  @Delete("admin/:id")
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a point package (Admin)" })
  remove(@Param("id") id: string) {
    return this.pointPackageService.remove(id);
  }

  // Business Endpoints

  @Get("business/available")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get available point packages for current business tier",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAvailablePackages(
    @Req() req,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    const businessId = req.user.id;
    const membership =
      await this.membershipService.findOneByBusinessId(businessId);

    if (!membership || !membership.tier) {
      return {
        data: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: 0,
        next: null,
        previous: null,
      };
    }

    return this.pointPackageService.getAvailablePackages(
      membership.tier.id,
      page,
      limit,
    );
  }

  @Post("business/buy")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buy a point package" })
  async buyPackage(
    @Req() req,
    @Body() body: { packageId: string; provider: string },
  ) {
    return this.pointPackageService.buyPackage(
      req.user.id,
      body.packageId,
      body.provider,
    );
  }

  @Post("business/confirm-purchase")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm a point package purchase" })
  @ApiBody({ type: ConfirmPointPurchaseDto })
  @ApiResponse({
    status: 201,
    description: "Purchase confirmed successfully",
    type: ConfirmPurchaseResponseDto,
  })
  async confirmPurchase(
    @Req() req,
    @Body() body: ConfirmPointPurchaseDto,
  ): Promise<ConfirmPurchaseResponseDto> {
    return this.pointPackageService.confirmPurchase(
      req.user.id,
      body.transactionId,
      body.provider,
    );
  }

  @Get("business/my-packages")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my purchased point packages" })
  async getMyPackages(@Req() req) {
    return this.pointPackageService.getMyPackages(req.user.id);
  }

  @Get("business/balance")
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get aggregate point balance from purchased packages",
  })
  @ApiResponse({
    status: 200,
    description: "Return total balance of active point packages.",
  })
  async getPointBalance(@Req() req) {
    return this.pointPackageService.getAggregateBalance(req.user.id);
  }

  @Get("tier/:tierId")
  @Public()
  @ApiOperation({ summary: "Get point packages for a specific tier" })
  @ApiParam({ name: "tierId", description: "The ID of the tier" })
  @ApiResponse({
    status: 200,
    description: "Return point packages for the tier.",
  })
  async getPointPackagesForTier(@Param("tierId") tierId: string) {
    return this.pointPackageService.findByTier(tierId);
  }
}
