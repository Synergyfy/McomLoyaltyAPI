import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Delete,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { QrPlaquesService } from "./qr-plaques.service";
import { AuthService } from "../../auth/auth.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { CreateQrPlaqueDto } from "./dto/create-qr-plaque.dto";
import { UpdateQrPlaqueDto } from "./dto/update-qr-plaque.dto";
import { QrPlaqueQueryDto } from "./dto/qr-plaque-query.dto";
import { Public } from "../../common/decorators/public.decorator";
import { QrPlaque } from "./entities/qr-plaque.entity";

@ApiTags("QR Plaques")
@Controller("qr-plaques")
export class QrPlaquesController {
  constructor(
    private readonly qrPlaquesService: QrPlaquesService,
    private readonly authService: AuthService,
  ) {}

  @Post("network/accept")
  @Roles(Role.Network, Role.Partner)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Accept plaque assignment (Requires Login)",
    description:
      "Verifies the invite code against the authenticated user's email. If valid, assigns the plaque.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { code: { type: "string", example: "123456" } },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Assignment accepted successfully.",
    type: QrPlaque,
  })
  async acceptAssignment(@Req() req, @Body() body: { code: string }) {
    // User must be logged in now. We verify against their authenticated email.
    const { plaque } = await this.qrPlaquesService.verifyInvite(
      body.code,
      req.user.email,
    );

    return {
      message: "Assignment accepted successfully",
      plaque,
    };
  }

  @Get("network/list")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Network, Role.Partner)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get plaques assigned to the current network contact or partner",
    description:
      "Returns all plaques assigned to any network profile associated with the authenticated user's email.",
  })
  @ApiResponse({ status: 200, type: [QrPlaque] })
  async getNetworkPlaques(@Req() req) {
    return this.qrPlaquesService.findAllNetwork(
      req.user.id,
      req.user.email,
      req.user.role,
    );
  }

  @Post()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Business, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new QR Plaque (Business or Admin)" })
  @ApiBody({ type: CreateQrPlaqueDto })
  @ApiResponse({
    status: 201,
    description: "The plaque has been successfully created.",
    type: QrPlaque,
  })
  async create(@Req() req, @Body() createQrPlaqueDto: CreateQrPlaqueDto) {
    let businessId = null;
    if (req.user.role === Role.Business) {
      businessId = req.user.id;
    }
    return this.qrPlaquesService.create(createQrPlaqueDto, businessId);
  }

  @Get()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all plaques for the current business with filtering",
  })
  async findAllBusiness(@Req() req, @Query() query: QrPlaqueQueryDto) {
    return this.qrPlaquesService.findAllBusiness(req.user.id, query);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Business)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update/Assign a plaque (Business only)" })
  @ApiParam({ name: "id", description: "Plaque ID" })
  @ApiBody({ type: UpdateQrPlaqueDto })
  async update(
    @Req() req,
    @Param("id") id: string,
    @Body() updateDto: UpdateQrPlaqueDto,
  ) {
    // Ownership check
    const plaque = await this.qrPlaquesService.findOne(id);
    if (
      !plaque.assignedBusiness ||
      plaque.assignedBusiness.id !== req.user.id
    ) {
      throw new UnauthorizedException("You do not own this plaque");
    }
    return this.qrPlaquesService.update(id, updateDto, req.user.id);
  }

  // Admin Endpoints

  @Get("admin/list")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all QR plaques (Admin only)" })
  async findAllAdmin(@Query() query: QrPlaqueQueryDto) {
    return this.qrPlaquesService.findAllAdmin(query);
  }

  @Patch("admin/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update a QR plaque, e.g. upload QR code URL (Admin only)",
  })
  @ApiBody({ type: UpdateQrPlaqueDto })
  async updateAdmin(
    @Param("id") id: string,
    @Body() updateDto: UpdateQrPlaqueDto,
  ) {
    return this.qrPlaquesService.update(id, updateDto);
  }

  @Delete("admin/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a QR plaque (Admin only)" })
  async remove(@Param("id") id: string) {
    return this.qrPlaquesService.remove(id);
  }

  // Public/Shared

  @Public()
  @Get(":code")
  @ApiOperation({ summary: "Get a QR plaque by its code" })
  async findOneByCode(@Param("code") code: string) {
    return this.qrPlaquesService.findOneByCode(code);
  }
}
