import { apiClient } from '../services/apiClient';

export const fpoApi = {
  listFpos: () => apiClient.get('/admin/fpos'),
  getMembers: (fpoId) => apiClient.get(`/fpo/${fpoId}/farmers`),
  getDemand: (fpoId) => apiClient.get(`/fpo/${fpoId}/demand`),
  createBundleTransaction: (fpoId, data) => apiClient.post(`/fpo/${fpoId}/bundle-transaction`, data),
};
