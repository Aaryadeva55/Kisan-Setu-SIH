import { StatusBadge } from './StatusBadge';
import { formatDate, formatRelativeTime } from '../../lib/utils';
import { UserCheck, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatusTimeline({ history = [], className }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-4 text-center">
        No status history recorded for this transaction.
      </div>
    );
  }

  return (
    <div className={cn('relative space-y-6 pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border', className)}>
      {history.map((step, index) => {
        const isLatest = index === history.length - 1;
        return (
          <div key={index} className="relative group">
            {/* Timeline Dot */}
            <div
              className={cn(
                'absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-surface flex items-center justify-center shadow-xs',
                isLatest ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/40'
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>

            {/* Step Content */}
            <div className="rounded-lg border border-border/80 bg-surface p-4 shadow-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={step.status} />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDate(step.timestamp, 'dd MMM yyyy, hh:mm a')}</span>
                  <span className="text-muted-foreground/60">({formatRelativeTime(step.timestamp)})</span>
                </div>
              </div>

              <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-agri-600 shrink-0" />
                <span>{step.actor}</span>
              </div>

              {step.note && (
                <p className="text-xs text-muted-foreground bg-surface-muted/60 p-2.5 rounded border border-border/40 leading-relaxed">
                  {step.note}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>End-to-end auditable transaction log (Government of Maharashtra Agri-Stack compliant)</span>
      </div>
    </div>
  );
}
