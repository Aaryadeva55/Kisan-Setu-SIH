import { useNavigate } from 'react-router-dom';
import { useFpoDemand, useCreateBundleTransaction } from '../../hooks/useFpo';
import { BundleTransactionForm } from '../../components/forms/BundleTransactionForm';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import { Layers } from 'lucide-react';

export function FpoBundle() {
  const { data: demandData, isLoading } = useFpoDemand();
  const createBundleMutation = useCreateBundleTransaction();
  const navigate = useNavigate();

  const demand = demandData?.demand || [];

  const handleSubmit = async (formData) => {
    try {
      await createBundleMutation.mutateAsync(formData);
      navigate('/fpo/transactions');
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
          <Layers className="h-3.5 w-3.5" />
          <span>Aggregation Workflow</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Multi-Farmer Demand Aggregator</h2>
        <p className="text-xs text-muted-foreground">
          Combine smallholder member harvests into commercial procurement lots to fulfill corporate buyer orders.
        </p>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : (
        <BundleTransactionForm
          demand={demand}
          onSubmit={handleSubmit}
          loading={createBundleMutation.isPending}
        />
      )}
    </div>
  );
}
