import { apiClient } from '../services/apiClient';

export const weatherApi = {
  getLatest: (districtId) => apiClient.get(`/weather/${districtId}/latest`),
  getHistory: (districtId) => apiClient.get(`/weather/${districtId}/history`),
};
