import { prisma } from '../../infra/prisma.js';

export class NotificationsRepository {
  async listUserNotifications(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'READ' },
    });
  }

  async createNotification(data: {
    userId: string;
    channel: string;
    title: string;
    body: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        channel: data.channel || 'IN_APP',
        title: data.title,
        body: data.body,
        status: 'PENDING',
      },
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
