import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MatchScoreBadge } from '../common/MatchScoreBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreBreakdown } from '../common/ScoreBreakdown';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatQuantity, formatDate } from '../../lib/utils';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function RequestCard({
  request,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isPending = request.status === 'REQUESTED' || request.status === 'MATCHED';
  const isAccepted = request.status === 'ACCEPTED';
  const isRejected = request.status === 'REJECTED';

  const handleConfirmAccept = () => {
    onAccept(request.id);
    setShowAcceptModal(false);
  };

  const handleConfirmReject = () => {
    onReject(request.id, rejectReason);
    setShowRejectModal(false);
  };

  return (
    <>
      <Card
        className={cn(
          'transition-all duration-300 border overflow-hidden',
          isAccepted && 'border-emerald-500/50 bg-emerald-50/20 ring-1 ring-emerald-500/30',
          isRejected && 'border-red-300/40 bg-red-50/10 opacity-75',
          isPending && 'hover:border-primary/50 hover:shadow-md'
        )}
      >
        <CardContent className="p-5 space-y-4">
          {/* Top Bar: Farmer + Status / Match Score */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-agri-100 text-agri-800 border border-agri-200 font-semibold shadow-xs">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground leading-tight">
                  {request.farmerName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {request.farmerVillage}, {request.districtName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {request.farmerPhone}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MatchScoreBadge score={request.matchScore || 82} />
              <StatusBadge status={request.status} />
            </div>
          </div>

          {/* Core Crop & Quantity Spec Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-border/80 bg-surface-muted/50 p-3.5 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Crop
              </span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{request.cropName}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Quantity Offered
              </span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {formatQuantity(request.quantityKg)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Expected Price
              </span>
              <p className="text-sm font-semibold text-primary mt-0.5">
                ₹{request.agreedPricePerKg}/kg
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Est. Total Value
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {formatCurrency(request.totalAmount || request.quantityKg * request.agreedPricePerKg)}
              </p>
            </div>
          </div>

          {/* Expandable Explainability Section */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex w-full items-center justify-between py-1.5 text-xs font-medium text-primary hover:text-agri-700 transition-colors"
            >
              <span>
                {showBreakdown ? 'Hide match factor breakdown' : 'Why this match? (Explainable AI Score)'}
              </span>
              {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showBreakdown && (
              <div className="mt-2 animate-in fade-in-50 duration-200">
                <ScoreBreakdown breakdown={request.scoreBreakdown} />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Requested {formatDate(request.requestedAt, 'dd MMM yyyy, hh:mm a')}</span>
            </div>

            {isPending && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>

                {/* THE SINGLE MOST IMPORTANT BUTTON IN THE PLATFORM */}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowAcceptModal(true)}
                  loading={isAccepting}
                  disabled={isRejecting}
                  className="flex-1 sm:flex-none bg-primary hover:bg-agri-700 text-white font-semibold shadow-md px-5"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Accept Request
                </Button>
              </div>
            )}

            {isAccepted && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Accepted • WhatsApp alert sent to farmer</span>
              </div>
            )}

            {isRejected && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Declined</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accept Confirm Dialog */}
      <ConfirmDialog
        open={showAcceptModal}
        onOpenChange={setShowAcceptModal}
        title="Confirm Transaction Acceptance"
        description={`Are you sure you want to accept this procurement request for ${formatQuantity(request.quantityKg)} of ${request.cropName} from ${request.farmerName} at ₹${request.agreedPricePerKg}/kg?`}
        confirmLabel="Yes, Accept & Notify Farmer"
        onConfirm={handleConfirmAccept}
        loading={isAccepting}
      >
        <div className="rounded-lg bg-agri-50 p-3 text-xs text-agri-900 border border-agri-200 space-y-1">
          <p className="font-semibold">WhatsApp Notification Trigger:</p>
          <p>
            An instant Marathi/Hindi WhatsApp confirmation message with digital delivery slip will be dispatched to {request.farmerPhone}.
          </p>
        </div>
      </ConfirmDialog>

      {/* Reject Dialog */}
      <ConfirmDialog
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        title="Decline Transaction Request"
        description={`Decline the request from ${request.farmerName}?`}
        confirmLabel="Decline Request"
        variant="destructive"
        onConfirm={handleConfirmReject}
        loading={isRejecting}
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Reason for declining (Optional):</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Price higher than current procurement target, or required by earlier date..."
            className="w-full rounded-md border border-input p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
