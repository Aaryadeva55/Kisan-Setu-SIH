import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getOverview(),
    refetchInterval: 15000, // 15 seconds polling during demo
  });
}

export function useAdminAnalytics(params) {
  return useQuery({
    queryKey: ['admin-analytics', params],
    queryFn: () => adminApi.getAnalytics(params),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 20000,
  });
}
