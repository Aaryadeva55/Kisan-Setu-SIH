import { cn } from '../../lib/utils';
import { MapPin, Scale, IndianRupee, Award, Calendar } from 'lucide-react';

export function ScoreBreakdown({ breakdown = {}, className }) {
  const factors = [
    {
      key: 'locationScore',
      label: 'Location Proximity',
      sublabel: 'Distance & transport logistics',
      value: breakdown.locationScore ?? 85,
      icon: MapPin,
      color: 'bg-emerald-500',
    },
    {
      key: 'quantityScore',
      label: 'Quantity Match',
      sublabel: 'Fulfills requirement volume',
      value: breakdown.quantityScore ?? 80,
      icon: Scale,
      color: 'bg-teal-500',
    },
    {
      key: 'priceScore',
      label: 'Price Realization',
      sublabel: 'Within maximum ceiling',
      value: breakdown.priceScore ?? 78,
      icon: IndianRupee,
      color: 'bg-amber-500',
    },
    {
      key: 'qualityScore',
      label: 'Quality Grade Fit',
      sublabel: 'Assayed or certified grade',
      value: breakdown.qualityScore ?? 90,
      icon: Award,
      color: 'bg-blue-500',
    },
    {
      key: 'timingScore',
      label: 'Harvest Timing',
      sublabel: 'Sowing/harvest schedule alignment',
      value: breakdown.timingScore ?? 75,
      icon: Calendar,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className={cn('rounded-lg border border-border bg-surface-muted/40 p-4 space-y-3', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Algorithmic Match Breakdown (Explainable AI)
        </h4>
        <span className="text-xs text-muted-foreground font-medium">Weighted Matrix</span>
      </div>

      <div className="space-y-2.5">
        {factors.map((factor) => {
          const Icon = factor.icon;
          return (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {factor.label}
                </span>
                <span className="font-semibold text-foreground">{factor.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full transition-all duration-500 rounded-full', factor.color)}
                  style={{ width: `${factor.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
