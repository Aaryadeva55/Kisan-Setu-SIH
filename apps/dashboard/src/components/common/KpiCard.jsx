import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function KpiCard({
  title,
  value,
  delta,
  deltaLabel = 'vs last 30 days',
  icon: Icon,
  loading = false,
  statusDot,
  subtitle,
  className,
}) {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositiveDelta = typeof delta === 'number' ? delta >= 0 : true;

  return (
    <Card className={cn('group overflow-hidden hover:border-primary/40 transition-all hover:shadow-md bg-surface', className)}>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {statusDot && (
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  statusDot === 'green' && 'bg-emerald-500 animate-pulse',
                  statusDot === 'yellow' && 'bg-amber-500',
                  statusDot === 'red' && 'bg-red-500'
                )}
              />
            )}
            {title}
          </span>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-agri-50 text-primary border border-agri-100 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Primary Value */}
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>

        {/* Delta Indicator */}
        {delta !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold rounded px-1.5 py-0.5',
                isPositiveDelta ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
              )}
            >
              {isPositiveDelta ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
            <span className="text-muted-foreground">{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
