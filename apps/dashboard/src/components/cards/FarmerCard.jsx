import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Sprout, ChevronRight, User } from 'lucide-react';

export function FarmerCard({ farmer, detailBasePath = '/admin/farmers' }) {
  return (
    <Card className="hover:border-primary/40 transition-all hover:shadow-md bg-surface">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-agri-100 text-agri-800 font-semibold border border-agri-200">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">{farmer.name}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {farmer.village}, {farmer.district}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-muted text-muted-foreground border">
            {farmer.landSizeAcres} Acres
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted/60 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{farmer.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sprout className="h-3.5 w-3.5" />
            <span>{farmer.advisoriesCount || 0} Advisories</span>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-border/60">
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
            {farmer.fpoName || 'Independent Farmer'}
          </span>
          <Link to={`${detailBasePath}/${farmer.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
              <span>View Profile</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
