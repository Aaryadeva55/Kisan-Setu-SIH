import { apiClient } from '../services/apiClient';

export const adminApi = {
  getOverview: () => apiClient.get('/admin/overview'),
  getAnalytics: (params) => apiClient.get(`/admin/analytics${params ? `?${new URLSearchParams(params)}` : ''}`),
  getSystemHealth: () => apiClient.get('/admin/system-health'),
};
