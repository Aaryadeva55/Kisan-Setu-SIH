import { apiClient } from '../services/apiClient';

export const transactionsApi = {
  list: (params) => apiClient.get(`/transactions${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: (id) => apiClient.get(`/transactions/${id}`),
  accept: (id) => apiClient.patch(`/transactions/${id}/accept`),
  reject: (id, reason) => apiClient.patch(`/transactions/${id}/reject`, { reason }),
  complete: (id) => apiClient.patch(`/transactions/${id}/complete`),
  cancel: (id) => apiClient.patch(`/transactions/${id}/cancel`),
};
