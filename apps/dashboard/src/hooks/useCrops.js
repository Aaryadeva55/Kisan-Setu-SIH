import { useQuery } from '@tanstack/react-query';
import { cropsApi } from '../api/crops.api';

export function useCrops() {
  return useQuery({
    queryKey: ['crops'],
    queryFn: () => cropsApi.list(),
  });
}
