import { Link } from 'react-router-dom';
import { useBuyerRequirements, useUpdateRequirement } from '../../hooks/useBuyerRequirements';
import { RequirementCard } from '../../components/cards/RequirementCard';
import { EmptyState } from '../../components/common/EmptyState';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/button';
import { Plus, ShoppingBag } from 'lucide-react';

export function BuyerRequirements() {
  const { data, isLoading } = useBuyerRequirements();
  const updateMutation = useUpdateRequirement();

  const requirements = data?.requirements || [];

  const handleToggleActive = (id, isActive) => {
    updateMutation.mutate({ id, data: { isActive } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Crop Requirements</h2>
          <p className="text-xs text-muted-foreground">
            Manage your open procurement demand lots. The matching engine continually pairs eligible farmer sell intents.
          </p>
        </div>

        <Link to="/buyer/requirements/new">
          <Button className="bg-primary hover:bg-agri-700 text-white font-semibold shadow-md gap-2">
            <Plus className="h-4 w-4" />
            <span>Post New Requirement</span>
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : requirements.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Crop Requirements Posted Yet"
          description="Create your first procurement lot requirement with crop specifications, price ceilings, and radius parameters."
          actionLabel="+ Post Your First Requirement"
          onAction={() => (window.location.href = '/buyer/requirements/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
