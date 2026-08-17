import { Notification } from "@prisma/client";
import { notificationRepository } from "../repositories/notification.repository";
import { socketService } from "./socket.service";

interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

export class NotificationService {
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // 1. Create in PostgreSQL
    const notification = await notificationRepository.create(data);

    // 2. Emit via Socket.IO if user is connected
    socketService.emitToUser(data.userId, "notification:receive", notification);

    return notification;
  }

  async getNotifications(userId: string, page: number, limit: number, unreadOnly: boolean) {
    const skip = (page - 1) * limit;
    return notificationRepository.findManyByUserId(userId, {
      skip,
      take: limit,
      unreadOnly,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnreadByUserId(userId);
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    return notificationRepository.delete(id, userId);
  }
}

export const notificationService = new NotificationService();
