import { apiClient } from '../services/apiClient';

export const marketApi = {
  getLatestPrices: () => apiClient.get('/market/prices/latest'),
  getPriceHistory: (cropId, mandiId) => apiClient.get(`/market/prices/history?cropId=${cropId || ''}&mandiId=${mandiId || ''}`),
};
