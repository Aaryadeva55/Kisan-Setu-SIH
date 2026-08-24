import { TRANSACTION_STATUS_CONFIG } from '../../constants/transactionStatus';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Truck,
  CheckCheck,
  XCircle,
  Ban,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap = {
  Send,
  Sparkles,
  CheckCircle2,
  Truck,
  CheckCheck,
  XCircle,
  Ban,
};

export function StatusBadge({ status, className }) {
  const config = TRANSACTION_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    color: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-gray-400',
    icon: 'Clock',
  };

  const IconComponent = iconMap[config.icon] || Clock;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all shadow-xs',
        config.color,
        className
      )}
      title={config.description}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      <IconComponent className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
