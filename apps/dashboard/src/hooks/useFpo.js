import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fpoApi } from '../api/fpo.api';
import { toast } from 'sonner';

export function useFposList() {
  return useQuery({
    queryKey: ['admin-fpos'],
    queryFn: () => fpoApi.listFpos(),
  });
}

export function useFpoMembers(fpoId = 'fpo_godavari') {
  return useQuery({
    queryKey: ['fpo-members', fpoId],
    queryFn: () => fpoApi.getMembers(fpoId),
  });
}

export function useFpoDemand(fpoId = 'fpo_godavari') {
  return useQuery({
    queryKey: ['fpo-demand', fpoId],
    queryFn: () => fpoApi.getDemand(fpoId),
  });
}

export function useCreateBundleTransaction(fpoId = 'fpo_godavari') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => fpoApi.createBundleTransaction(fpoId, data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Bundle transaction created successfully!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fpo-demand'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create bundle transaction');
    },
  });
}
