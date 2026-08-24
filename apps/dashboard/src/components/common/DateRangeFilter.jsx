import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export function DateRangeFilter({ range = '30d', onChange, className }) {
  const ranges = [
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: '90d', label: 'Last 90 Days' },
    { key: 'year', label: 'This Season (Kharif 2026)' },
  ];

  return (
    <div className={cn('inline-flex items-center rounded-lg border border-border bg-surface p-1 shadow-xs', className)}>
      <Calendar className="h-4 w-4 ml-2 mr-1.5 text-muted-foreground" />
      <div className="flex gap-1">
        {ranges.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange?.(item.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              range === item.key
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
