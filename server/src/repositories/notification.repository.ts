import { Notification, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export class NotificationRepository {
  async create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  async findManyByUserId(
    userId: string,
    options: { skip?: number; take?: number; unreadOnly?: boolean }
  ): Promise<{ data: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (options.unreadOnly) {
      where.read = false;
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: options.skip,
        take: options.take,
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const exists = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!exists) return null;

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const exists = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!exists) return false;

    await prisma.notification.delete({
      where: { id },
    });
    return true;
  }
}

export const notificationRepository = new NotificationRepository();
