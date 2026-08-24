import { apiClient } from '../services/apiClient';

export const buyersApi = {
  listBuyers: () => apiClient.get('/admin/buyers'),
  getRequirements: () => apiClient.get('/buyers/requirements'),
  createRequirement: (data) => apiClient.post('/buyers/requirements', data),
  updateRequirement: (id, data) => apiClient.patch(`/buyers/requirements/${id}`, data),
};
