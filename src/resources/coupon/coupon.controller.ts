import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { CouponService } from "./coupon.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Coupon } from "./entities/coupon.entity";

@ApiTags("Coupon")
@Controller("coupon")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Create a new coupon (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "The coupon has been successfully created.",
    type: Coupon,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get all coupons (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Return all coupons.",
    type: [Coupon],
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findAll() {
    return this.couponService.findAll();
  }

  @Get(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Get a coupon by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "Return the coupon.", type: Coupon })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Coupon not found." })
  findOne(@Param("id") id: string) {
    return this.couponService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Update a coupon (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The coupon has been successfully updated.",
    type: Coupon,
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Coupon not found." })
  update(@Param("id") id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @ApiOperation({ summary: "Delete a coupon (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "The coupon has been successfully deleted.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Coupon not found." })
  remove(@Param("id") id: string) {
    return this.couponService.remove(id);
  }
}
