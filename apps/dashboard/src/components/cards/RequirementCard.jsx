import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatQuantity, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Edit, Sparkles } from 'lucide-react';

export function RequirementCard({ requirement, onToggleActive }) {
  return (
    <Card className="hover:border-primary/40 transition-all hover:shadow-md bg-surface">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">{requirement.cropName}</h3>
              <Badge variant={requirement.isActive ? 'success' : 'outline'}>
                {requirement.isActive ? 'Active Demand' : 'Paused'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grade {requirement.minQualityGrade} minimum quality
            </p>
          </div>

          <Link to={`/buyer/requirements/${requirement.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-muted/60 p-3 text-center">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Volume Target</span>
            <p className="text-sm font-semibold text-foreground mt-0.5">{formatQuantity(requirement.quantityKg)}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Max Price</span>
            <p className="text-sm font-semibold text-primary mt-0.5">₹{requirement.maxPricePerKg || 'Market'}/kg</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Radius</span>
            <p className="text-sm font-semibold text-foreground mt-0.5">{requirement.radiusKm} km</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {requirement.districtName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Needed by {formatDate(requirement.neededByDate)}
          </span>
        </div>

        {/* Match Counter & Action */}
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-agri-700">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {requirement.matchedCount || 0} Farmer Matches Found
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive?.(requirement.id, !requirement.isActive)}
            className="text-xs h-7 px-2.5"
          >
            {requirement.isActive ? 'Pause Matching' : 'Resume Matching'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
