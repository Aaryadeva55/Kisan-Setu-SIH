import { apiClient } from '../services/apiClient';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
};
