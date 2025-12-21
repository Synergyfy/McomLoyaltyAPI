import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Participant } from "../participant/entities/participant.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";

import { Role } from "src/common/role.enum";

@ApiTags("wishlist")
@Controller("wishlist")
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: "Create a wishlist item" })
  @ApiResponse({
    status: 201,
    description: "The wishlist item has been successfully created.",
  })
  @ApiResponse({ status: 400, description: "Bad Request." })
  create(
    @Body() createWishlistDto: CreateWishlistDto,
    @CurrentUser() participant: Participant,
  ) {
    return this.wishlistService.create(createWishlistDto, participant);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a wishlist item" })
  @ApiResponse({
    status: 200,
    description: "The wishlist item has been successfully updated.",
  })
  @ApiResponse({ status: 404, description: "Wishlist item not found." })
  update(
    @Param("id") id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
    @CurrentUser() participant: Participant,
  ) {
    return this.wishlistService.update(id, updateWishlistDto, participant);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a wishlist item" })
  @ApiResponse({
    status: 200,
    description: "The wishlist item has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Wishlist item not found." })
  remove(@Param("id") id: string, @CurrentUser() participant: Participant) {
    return this.wishlistService.remove(id, participant);
  }

  @Get("business/wishlist-insights")
  @ApiOperation({ summary: "Get aggregated wishlist insights for businesses" })
  @ApiResponse({
    status: 200,
    description: "Paginated aggregated wishlist data.",
  })
  getWishlistInsights(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.wishlistService.getWishlistInsights(paginationDto, user);
  }

  @Get("my-wishlist")
  @ApiOperation({ summary: "Get the authenticated participant's wishlist" })
  @ApiResponse({
    status: 200,
    description: "Paginated list of wishlist items.",
  })
  findMyWishlist(
    @CurrentUser() participant: Participant,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.wishlistService.findMyWishlist(participant, paginationDto);
  }

  @Post("campaign/target-wishlist")
  @ApiOperation({ summary: "Create a campaign targeting a wishlist" })
  @ApiResponse({
    status: 201,
    description: "The campaign has been successfully created.",
  })
  targetWishlist() {
    // This would be implemented in a separate campaign service,
    // which would then call the wishlist service to get the target audience.
    return "This endpoint is a placeholder for creating a campaign targeting a wishlist.";
  }
}
