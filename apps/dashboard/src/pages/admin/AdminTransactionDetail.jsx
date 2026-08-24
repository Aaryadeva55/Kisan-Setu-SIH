import { useParams, Link } from 'react-router-dom';
import { useTransactionDetail, useCancelTransaction } from '../../hooks/useTransactions';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MatchScoreBadge } from '../../components/common/MatchScoreBadge';
import { ScoreBreakdown } from '../../components/common/ScoreBreakdown';
import { StatusTimeline } from '../../components/common/StatusTimeline';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { formatCurrency, formatQuantity } from '../../lib/utils';
import { ArrowLeft, Ban, User, Phone, MapPin, Building2, ShieldCheck } from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useState } from 'react';

export function AdminTransactionDetail() {
  const { id } = useParams();
  const { data, isLoading } = useTransactionDetail(id);
  const cancelMutation = useCancelTransaction();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const txn = data?.transaction;

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading transaction audit...</div>;
  }

  if (!txn) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Transaction #{id} not found.</p>
        <Link to="/admin/transactions" className="text-xs text-primary font-semibold">
          Return to Transactions Ledger
        </Link>
      </div>
    );
  }

  const canCancel = txn.status !== 'COMPLETED' && txn.status !== 'CANCELLED';

  const handleCancelConfirm = () => {
    cancelMutation.mutate(txn.id);
    setShowCancelModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            to="/admin/transactions"
            className="inline-flex items-center text-xs font-semibold text-primary hover:text-agri-700 mb-1 gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Transactions Ledger
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-mono">{txn.id}</h2>
            <StatusBadge status={txn.status} />
            <MatchScoreBadge score={txn.matchScore} />
          </div>
        </div>

        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="gap-1.5"
          >
            <Ban className="h-4 w-4" />
            <span>Administrative Override (Cancel)</span>
          </Button>
        )}
      </div>

      {/* Lot Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Farmer Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-bold text-foreground">{txn.farmerName}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{txn.farmerPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{txn.farmerVillage}, {txn.districtName}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Procuring Buyer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-bold text-foreground">{txn.buyerName}</div>
            <div className="text-xs text-muted-foreground">Operational Hub: {txn.districtName}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface-muted/40 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agreed Settlement Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Crop Commodity:</span>
              <span className="font-semibold text-foreground">{txn.cropName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Agreed Volume:</span>
              <span className="font-semibold text-foreground">{formatQuantity(txn.quantityKg)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Price Rate:</span>
              <span className="font-bold text-primary">₹{txn.agreedPricePerKg} / kg</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border font-bold">
              <span>Total Settlement:</span>
              <span className="text-foreground">{formatCurrency(txn.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Explainable AI Match Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreBreakdown breakdown={txn.scoreBreakdown} />
        </CardContent>
      </Card>

      {/* Audit Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Auditable Transaction Lifecycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline history={txn.statusHistory} />
        </CardContent>
      </Card>

      {/* Confirm Cancel Modal */}
      <ConfirmDialog
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title="Confirm Administrative Cancellation"
        description="Are you sure you want to cancel this transaction? This action will be logged in the permanent audit trail."
        confirmLabel="Cancel Transaction"
        variant="destructive"
        onConfirm={handleCancelConfirm}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
