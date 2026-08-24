import { apiClient } from '../services/apiClient';

export const farmersApi = {
  list: (params) => apiClient.get(`/farmers${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: (id) => apiClient.get(`/farmers/${id}`),
  getAdvisories: (id) => apiClient.get(`/farmers/${id}/advisories`),
  getSellIntents: (id) => apiClient.get(`/farmers/${id}/sell-intents`),
};
