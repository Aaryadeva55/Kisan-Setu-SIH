import { Button } from '../ui/button';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There is currently no data to display matching your criteria.',
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/30 p-8 text-center sm:p-12', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-agri-50 text-agri-600 border border-agri-100 shadow-xs mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
