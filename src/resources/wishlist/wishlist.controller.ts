
import { Controller, Get, Post, Body } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Participant } from '../participant/entities/participant.entity';

@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'Create a wishlist item' })
  @ApiResponse({ status: 201, description: 'The wishlist item has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @Body() createWishlistDto: CreateWishlistDto,
    @CurrentUser() participant: Participant,
  ) {
    return this.wishlistService.create(createWishlistDto, participant);
  }

  @Get('business/wishlist-insights')
  @ApiOperation({ summary: 'Get aggregated wishlist insights for businesses' })
  @ApiResponse({ status: 200, description: 'Aggregated wishlist data.' })
  getWishlistInsights() {
    return this.wishlistService.getWishlistInsights();
  }

  @Post('campaign/target-wishlist')
  @ApiOperation({ summary: 'Create a campaign targeting a wishlist' })
  @ApiResponse({ status: 201, description: 'The campaign has been successfully created.' })
  targetWishlist() {
    // This would be implemented in a separate campaign service,
    // which would then call the wishlist service to get the target audience.
    return 'This endpoint is a placeholder for creating a campaign targeting a wishlist.';
  }
}
