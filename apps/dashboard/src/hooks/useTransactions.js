import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions.api';
import { toast } from 'sonner';

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionsApi.list(params),
  });
}

export function useTransactionDetail(id) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useAcceptTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => transactionsApi.accept(id),
    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousData = queryClient.getQueryData(['transactions']);

      // Optimistically update list
      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old) => {
        if (!old?.transactions) return old;
        return {
          ...old,
          transactions: old.transactions.map((t) =>
            t.id === id ? { ...t, status: 'ACCEPTED', acceptedAt: new Date().toISOString() } : t
          ),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['transactions'], context.previousData);
      }
      toast.error(err.message || 'Failed to accept transaction');
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Request accepted! Farmer notified on WhatsApp.');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}

export function useRejectTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => transactionsApi.reject(id, reason),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousData = queryClient.getQueryData(['transactions']);

      queryClient.setQueriesData({ queryKey: ['transactions'] }, (old) => {
        if (!old?.transactions) return old;
        return {
          ...old,
          transactions: old.transactions.map((t) =>
            t.id === id ? { ...t, status: 'REJECTED', rejectedAt: new Date().toISOString() } : t
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['transactions'], context.previousData);
      }
      toast.error(err.message || 'Failed to reject transaction');
    },
    onSuccess: () => {
      toast.info('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}

export function useCompleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => transactionsApi.complete(id),
    onSuccess: (data) => {
      toast.success(data?.message || 'Transaction marked completed and settled');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to mark transaction complete');
    },
  });
}

export function useCancelTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => transactionsApi.cancel(id),
    onSuccess: (data) => {
      toast.info(data?.message || 'Transaction cancelled');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel transaction');
    },
  });
}
