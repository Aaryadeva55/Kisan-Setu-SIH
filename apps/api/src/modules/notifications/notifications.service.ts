import { notificationsRepository } from './notifications.repository.js';

export class NotificationsService {
  async getUserNotifications(userId: string) {
    return notificationsRepository.listUserNotifications(userId);
  }

  async markNotificationRead(id: string, userId: string) {
    await notificationsRepository.markAsRead(id, userId);
    return { success: true };
  }
}

export const notificationsService = new NotificationsService();
