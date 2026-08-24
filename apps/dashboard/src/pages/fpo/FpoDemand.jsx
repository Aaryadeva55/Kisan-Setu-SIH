import { useFpoDemand } from '../../hooks/useFpo';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Calendar, Layers, Sparkles } from 'lucide-react';
import { formatQuantity, formatDate } from '../../lib/utils';

export function FpoDemand() {
  const { data, isLoading } = useFpoDemand();
  const demand = data?.demand || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Active Buyer Procurement Demand</h2>
          <p className="text-xs text-muted-foreground">
            Commercial purchase orders matching your FPO's focus crops (Soybean, Onion, Grapes)
          </p>
        </div>

        <Link to="/fpo/bundle">
          <Button className="bg-primary hover:bg-agri-700 text-white font-semibold shadow-md gap-2">
            <Layers className="h-4 w-4" />
            <span>Launch Bundle Builder</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : demand.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Open Demand Matches"
          description="Currently there are no buyer procurement orders posted matching member crops."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {demand.map((req) => (
            <Card key={req.id} className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md bg-surface">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{req.cropName}</h3>
                    <p className="text-xs text-muted-foreground">{req.buyerName}</p>
                  </div>
                  <span className="text-sm font-bold text-primary px-2.5 py-1 rounded bg-agri-50 border border-agri-200">
                    ₹{req.maxPricePerKg}/kg
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted/60 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Volume Needed</span>
                    <span className="font-semibold text-foreground">{formatQuantity(req.quantityKg)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Quality Grade</span>
                    <span className="font-semibold text-foreground">Grade {req.minQualityGrade}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {req.districtName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    By {formatDate(req.neededByDate)}
                  </span>
                </div>

                <Link to="/fpo/bundle" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-primary hover:bg-agri-50">
                    Aggregate Member Farmers for this Lot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
