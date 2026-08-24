import { apiClient } from '../services/apiClient';

export const recommendationsApi = {
  getLatestAdvisory: (farmerId) => apiClient.get(`/recommendations/${farmerId}/latest`),
};
