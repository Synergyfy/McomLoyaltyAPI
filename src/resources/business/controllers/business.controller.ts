import { Controller, Post, Body, ValidationPipe, Get, Patch, Delete, Request, UseGuards } from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { OnboardingDto } from '../dto/onboarding.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BuyPointsDto } from '../dto/buy-points.dto';
import { PointPurchaseConfigDto } from '../dto/point-purchase-config.dto';

@ApiTags('Business Lifecycle')
@Controller('business')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) { }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new business profile' })
  @ApiResponse({ status: 201, description: 'The business profile has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or email/name already exists.' })
  @ApiBody({ type: CreateBusinessDto })
  async create(@Body(new ValidationPipe()) createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @ApiBearerAuth()
  @Roles(Role.Business)
  @Post('onboarding')
  @ApiOperation({ summary: 'Onboard a new business with additional details' })
  @ApiResponse({ status: 201, description: 'The business has been successfully onboarded.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: OnboardingDto })
  async onboarding(@Request() req, @Body(new ValidationPipe()) onboardingDto: OnboardingDto) {
    return this.businessService.onboarding(req.user.id, onboardingDto);
  }

  @Roles(Role.Business)
  @Get('profile')
  @ApiOperation({ summary: 'Get business profile' })
  @ApiResponse({ status: 200, description: 'Return business profile.' })
  async getProfile(@Request() req) {
    return this.businessService.findById(req.user.id);
  }

  @Roles(Role.Business)
  @Patch('profile')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'The business profile has been successfully updated.' })
  @ApiBody({ type: UpdateBusinessDto })
  async updateProfile(@Request() req, @Body(new ValidationPipe()) updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(req.user.id, updateBusinessDto);
  }

  @Roles(Role.Business)
  @Get('subscription')
  @ApiOperation({ summary: 'Get business subscription level' })
  @ApiResponse({ status: 200, description: 'Return business subscription details.' })
  async getSubscription(@Request() req) {
    return this.businessService.getSubscriptionLevel(req.user.id);
  }

  @Roles(Role.Business)
  @Get('billing-history')
  @ApiOperation({ summary: 'Get business billing history' })
  @ApiResponse({ status: 200, description: 'Return business billing history.' })
  async getBillingHistory(@Request() req) {
    return this.businessService.getBillingHistory(req.user.id);
  }

  @Roles(Role.Business)
  @Get('onboarding-status')
  @ApiOperation({ summary: 'Get business onboarding status' })
  @ApiResponse({ status: 200, description: 'Return business onboarding status.' })
  async getOnboardingStatus(@Request() req) {
    return this.businessService.getOnboardingStatus(req.user.id);
  }

  @Roles(Role.Business)
  @Delete('profile')
  @ApiOperation({ summary: 'Delete business profile' })
  @ApiResponse({ status: 200, description: 'The business profile has been successfully deleted.' })
  async deleteProfile(@Request() req) {
    return this.businessService.delete(req.user.id);
  }
  @Roles(Role.Business)
  @Get('points/balance/monthly')
  @ApiOperation({ summary: 'Get monthly point balance' })
  @ApiResponse({ status: 200, description: 'Return monthly point balance.' })
  async getMonthlyPointBalance(@Request() req) {
    return this.businessService.getMonthlyPointBalance(req.user.id);
  }

  @Roles(Role.Business)
  @Get('points/balance/total')
  @ApiOperation({ summary: 'Get total subscription point balance' })
  @ApiResponse({ status: 200, description: 'Return total subscription point balance.' })
  async getTotalSubscriptionPointBalance(@Request() req) {
    return this.businessService.getTotalSubscriptionPointBalance(req.user.id);
  }

  @Roles(Role.Business)
  @Post('points/buy')
  @ApiOperation({ summary: 'Buy extra points' })
  @ApiResponse({ status: 200, description: 'Points purchased successfully.' })
  @ApiBody({ type: BuyPointsDto })
  async buyExtraPoints(@Request() req, @Body(new ValidationPipe()) buyPointsDto: BuyPointsDto) {
    return this.businessService.buyExtraPoints(req.user.id, buyPointsDto.points, buyPointsDto.paymentMethod);
  }

  @Roles(Role.Business)
  @Get('points/purchase-config')
  @ApiOperation({ summary: 'Get point purchase configuration' })
  @ApiResponse({ status: 200, description: 'Return point purchase configuration.', type: PointPurchaseConfigDto })
  async getPointPurchaseConfig(@Request() req) {
    return this.businessService.getPointPurchaseConfig(req.user.id);
  }
}