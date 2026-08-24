import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBuyerRequirements } from '../../hooks/useBuyerRequirements';
import { useTransactions } from '../../hooks/useTransactions';
import { KpiCard } from '../../components/common/KpiCard';
import { RequestCard } from '../../components/cards/RequestCard';
import { useAcceptTransaction, useRejectTransaction } from '../../hooks/useTransactions';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { ShoppingBag, Inbox, CheckCircle2, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function BuyerDashboard() {
  const { user } = useAuthStore();
  const { data: reqData, isLoading: reqLoading } = useBuyerRequirements();
  const { data: txData, isLoading: txLoading } = useTransactions();
  const acceptMutation = useAcceptTransaction();
  const rejectMutation = useRejectTransaction();

  const requirements = reqData?.requirements || [];
  const transactions = txData?.transactions || [];

  const activeReqCount = requirements.filter((r) => r.isActive).length;
  const pendingRequests = transactions.filter((t) => t.status === 'REQUESTED' || t.status === 'MATCHED');
  const completedTxnCount = transactions.filter((t) => t.status === 'COMPLETED').length;
  const totalVolumeProcured = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-agri-200 bg-gradient-to-r from-agri-50 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Procurement Hub Online</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Welcome back, {user?.name || 'Sahyadri Buyer'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {user?.orgName} • Operational in Nashik Hub & Surrounding Districts
          </p>
        </div>

        <Link to="/buyer/requirements/new">
          <Button className="bg-primary hover:bg-agri-700 text-white font-semibold shadow-md gap-2 h-11 px-5">
            <Plus className="h-4 w-4" />
            <span>Post New Requirement</span>
          </Button>
        </Link>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Requirements"
          value={activeReqCount}
          subtitle="Open lot targets matching farmers"
          icon={ShoppingBag}
          loading={reqLoading}
        />
        <KpiCard
          title="Pending Farmer Requests"
          value={pendingRequests.length}
          subtitle="Awaiting your acceptance review"
          icon={Inbox}
          statusDot={pendingRequests.length > 0 ? 'green' : undefined}
          loading={txLoading}
        />
        <KpiCard
          title="Completed Transactions"
          value={completedTxnCount}
          subtitle="Direct farmer settlements closed"
          icon={CheckCircle2}
          loading={txLoading}
        />
        <KpiCard
          title="Total Value Procured"
          value={formatCurrency(totalVolumeProcured)}
          subtitle="Settled via direct market linkage"
          icon={CheckCircle2}
          loading={txLoading}
        />
      </div>

      {/* Primary Highlight: Incoming Requests Climax Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Incoming Farmer Matches</span>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground">
                  {pendingRequests.length} Pending
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Smallholders matched by the algorithm. Accepting sends an instant WhatsApp confirmation.
            </p>
          </div>

          <Link to="/buyer/requests">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary">
              <span>View All Requests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground">
              No pending farmer requests at this moment. New matches appear here in real-time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.slice(0, 2).map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={(id) => acceptMutation.mutate(id)}
                onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
                isAccepting={acceptMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
