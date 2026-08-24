import { useNavigate, Link } from 'react-router-dom';
import { RequirementForm } from '../../components/forms/RequirementForm';
import { useCreateRequirement } from '../../hooks/useBuyerRequirements';
import { ArrowLeft } from 'lucide-react';

export function BuyerRequirementNew() {
  const createMutation = useCreateRequirement();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      navigate('/buyer/requirements');
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/buyer/requirements"
          className="inline-flex items-center text-xs font-semibold text-primary hover:text-agri-700 mb-2 gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Requirements
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Post New Crop Requirement</h2>
        <p className="text-xs text-muted-foreground">
          Define lot specifications to automatically match smallholder farmers and FPO aggregation clusters.
        </p>
      </div>

      <RequirementForm
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
        submitLabel="Post Requirement & Start Matching"
      />
    </div>
  );
}
