import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyersApi } from '../api/buyers.api';
import { toast } from 'sonner';

export function useBuyersList() {
  return useQuery({
    queryKey: ['admin-buyers'],
    queryFn: () => buyersApi.listBuyers(),
  });
}

export function useBuyerRequirements() {
  return useQuery({
    queryKey: ['buyer-requirements'],
    queryFn: () => buyersApi.getRequirements(),
  });
}

export function useCreateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => buyersApi.createRequirement(data),
    onSuccess: () => {
      toast.success('Requirement posted successfully');
      queryClient.invalidateQueries({ queryKey: ['buyer-requirements'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to post requirement');
    },
  });
}

export function useUpdateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => buyersApi.updateRequirement(id, data),
    onSuccess: () => {
      toast.success('Requirement updated');
      queryClient.invalidateQueries({ queryKey: ['buyer-requirements'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update requirement');
    },
  });
}
