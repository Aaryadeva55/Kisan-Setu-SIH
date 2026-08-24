import { apiClient } from '../services/apiClient';

export const cropsApi = {
  list: () => apiClient.get('/crops'),
};
