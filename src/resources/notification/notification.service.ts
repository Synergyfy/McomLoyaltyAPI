import { Injectable } from '@nestjs/common';

interface Notification {
  userId: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class NotificationService {
  private readonly notifications: Notification[] = [];

  send(userId: string, message: string) {
    const newNotification = { userId, message, timestamp: new Date() };
    this.notifications.push(newNotification);
    console.log('Notification sent:', newNotification);
  }

  findAll(): Notification[] {
    return this.notifications;
  }
}
