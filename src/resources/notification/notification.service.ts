import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { User } from "../../common/interfaces/user.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Role } from "../../common/role.enum";
import {
  NotificationType,
  NotificationRecipientType,
} from "./enums/notification-type.enum";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    title: string,
    message: string,
    type: NotificationType,
    recipientType: NotificationRecipientType,
    recipientId: string,
    relatedEntityId?: string,
  ) {
    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      recipient_type: recipientType,
      related_entity_id: relatedEntityId,
    });

    if (recipientType === NotificationRecipientType.BUSINESS) {
      notification.business = { id: recipientId } as any;
    } else {
      notification.participant = { id: recipientId } as any;
    }

    return this.notificationRepository.save(notification);
  }

  async findAll(user: User, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (user.role === Role.Business) {
      whereCondition.business = { id: user.id };
    } else if (user.role === Role.Participant) {
      whereCondition.participant = { id: user.id };
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where: whereCondition,
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    // Count unread
    const unreadCount = await this.notificationRepository.count({
      where: {
        ...whereCondition,
        is_read: false,
      },
    });

    return {
      data,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async markAsRead(user: User, id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ["business", "participant"],
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    // Verify ownership
    if (user.role === Role.Business && notification.business?.id !== user.id) {
      throw new ForbiddenException(
        "You do not have access to this notification",
      );
    }
    if (
      user.role === Role.Participant &&
      notification.participant?.id !== user.id
    ) {
      throw new ForbiddenException(
        "You do not have access to this notification",
      );
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(user: User) {
    const whereCondition: any = {};
    if (user.role === Role.Business) {
      whereCondition.business = { id: user.id };
    } else if (user.role === Role.Participant) {
      whereCondition.participant = { id: user.id };
    }

    await this.notificationRepository.update(whereCondition, { is_read: true });
    return { success: true };
  }
}
