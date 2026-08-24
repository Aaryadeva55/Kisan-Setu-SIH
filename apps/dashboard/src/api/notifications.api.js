import { apiClient } from '../services/apiClient';

export const notificationsApi = {
  list: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
};
