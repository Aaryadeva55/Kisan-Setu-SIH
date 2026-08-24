import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';

export function MatchScoreBadge({ score = 0, size = 'default', showIcon = true, className }) {
  let colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let dotColor = 'bg-emerald-500';

  if (score < 50) {
    colorClasses = 'bg-red-50 text-red-800 border-red-300';
    dotColor = 'bg-red-500';
  } else if (score < 75) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-xs',
        colorClasses,
        isSmall && 'px-2 py-0.5 text-xs',
        size === 'default' && 'px-2.5 py-1 text-xs',
        isLarge && 'px-3 py-1.5 text-sm',
        className
      )}
    >
      {showIcon && <Sparkles className={cn('shrink-0', isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      <span>{score}% Match</span>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
    </span>
  );
}
