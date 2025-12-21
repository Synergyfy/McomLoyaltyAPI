import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../common/interfaces/user.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Get notifications for the current user" })
  @ApiResponse({ status: 200, description: "Returns paginated notifications." })
  findAll(@CurrentUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.notificationService.findAll(user, paginationDto);
  }

  @Patch(":id/read")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read." })
  markAsRead(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(user, id);
  }

  @Patch("read-all")
  @Roles(Role.Business, Role.Participant)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read.",
  })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user);
  }
}
