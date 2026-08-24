import { useQuery } from '@tanstack/react-query';
import { farmersApi } from '../api/farmers.api';

export function useFarmers(params) {
  return useQuery({
    queryKey: ['farmers', params],
    queryFn: () => farmersApi.list(params),
  });
}

export function useFarmerDetail(id) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: () => farmersApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useFarmerAdvisories(id) {
  return useQuery({
    queryKey: ['farmer-advisories', id],
    queryFn: () => farmersApi.getAdvisories(id),
    enabled: Boolean(id),
  });
}

export function useFarmerSellIntents(id) {
  return useQuery({
    queryKey: ['farmer-sell-intents', id],
    queryFn: () => farmersApi.getSellIntents(id),
    enabled: Boolean(id),
  });
}
