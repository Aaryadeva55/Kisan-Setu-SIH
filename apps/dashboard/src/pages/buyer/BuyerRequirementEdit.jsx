import { useNavigate, useParams, Link } from 'react-router-dom';
import { RequirementForm } from '../../components/forms/RequirementForm';
import { useBuyerRequirements, useUpdateRequirement } from '../../hooks/useBuyerRequirements';
import { ArrowLeft } from 'lucide-react';

export function BuyerRequirementEdit() {
  const { id } = useParams();
  const { data, isLoading } = useBuyerRequirements();
  const updateMutation = useUpdateRequirement();
  const navigate = useNavigate();

  const requirements = data?.requirements || [];
  const requirement = requirements.find((r) => r.id === id);

  const handleSubmit = async (formData) => {
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      navigate('/buyer/requirements');
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading requirement...</div>;
  }

  if (!requirement) {
    return (
      <div className="text-center p-8 space-y-3">
        <p className="text-sm text-muted-foreground">Requirement not found.</p>
        <Link to="/buyer/requirements" className="text-xs text-primary font-semibold">
          Return to Requirements
        </Link>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Requirement #{requirement.id}</h2>
        <p className="text-xs text-muted-foreground">
          Update quantity, price, or radius parameters for this procurement lot.
        </p>
      </div>

      <RequirementForm
        initialData={requirement}
        onSubmit={handleSubmit}
        loading={updateMutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}
