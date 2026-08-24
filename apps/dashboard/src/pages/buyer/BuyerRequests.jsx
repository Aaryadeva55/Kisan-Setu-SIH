import { useState } from 'react';
import { useTransactions, useAcceptTransaction, useRejectTransaction } from '../../hooks/useTransactions';
import { RequestCard } from '../../components/cards/RequestCard';
import { EmptyState } from '../../components/common/EmptyState';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Inbox, Sparkles, ShieldCheck } from 'lucide-react';

export function BuyerRequests() {
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { data, isLoading } = useTransactions();
  const acceptMutation = useAcceptTransaction();
  const rejectMutation = useRejectTransaction();

  const allTransactions = data?.transactions || [];

  // Filter logic
  const filteredRequests = allTransactions.filter((t) => {
    if (statusFilter === 'PENDING') {
      return t.status === 'REQUESTED' || t.status === 'MATCHED';
    }
    if (statusFilter === 'ACCEPTED') {
      return t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS' || t.status === 'COMPLETED';
    }
    if (statusFilter === 'REJECTED') {
      return t.status === 'REJECTED';
    }
    return true; // ALL
  });

  const pendingCount = allTransactions.filter((t) => t.status === 'REQUESTED' || t.status === 'MATCHED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-agri-50 border border-agri-200 px-2.5 py-0.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>AI Explainable Matching Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Incoming Matched Farmer Requests
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Farmers who converted an advisory into a Sell Intent. Review explainable match criteria and click <strong>Accept</strong> to confirm procurement.
          </p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList className="bg-surface-muted border border-border">
            <TabsTrigger value="PENDING" className="gap-1.5 text-xs font-semibold">
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ACCEPTED" className="text-xs">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="REJECTED" className="text-xs">
              Declined
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs">
              All History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Demo Climax Guide Banner */}
      {statusFilter === 'PENDING' && pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-agri-200 bg-agri-50/60 p-4 text-xs text-agri-900 shadow-2xs">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="font-bold">SIH Live Demo Walkthrough:</span> Click <strong>"Why this match?"</strong> on Sunita Tai's request to inspect the 5-factor breakdown, then click <strong>"Accept Request"</strong> to trigger the automated WhatsApp farmer notification.
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            statusFilter === 'PENDING'
              ? 'No Pending Requests Right Now'
              : `No ${statusFilter.toLowerCase()} requests recorded`
          }
          description="As farmers register sell intents on WhatsApp matching your crop requirements, actionable lots will appear here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((req) => (
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
  );
}
