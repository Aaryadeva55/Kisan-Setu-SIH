import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useFpoMembers, useFpoDemand } from '../../hooks/useFpo';
import { useTransactions } from '../../hooks/useTransactions';
import { KpiCard } from '../../components/common/KpiCard';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Users, ShoppingBag, Layers, ReceiptText, Plus, ArrowRight, Sprout } from 'lucide-react';
import { formatCurrency, formatQuantity } from '../../lib/utils';

export function FpoDashboard() {
  const { user } = useAuthStore();
  const { data: membersData, isLoading: membersLoading } = useFpoMembers();
  const { data: demandData, isLoading: demandLoading } = useFpoDemand();
  const { data: txData } = useTransactions();

  const members = membersData?.farmers || [];
  const demand = demandData?.demand || [];
  const transactions = txData?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-agri-200 bg-gradient-to-r from-agri-50 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sprout className="h-3.5 w-3.5" />
            <span>FPO Cooperative Operations Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {user?.orgName || 'Godavari Farmer Producer Co.'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Representing 340+ smallholders in Nashik & Niphad Clusters
          </p>
        </div>

        <Link to="/fpo/bundle">
          <Button className="bg-primary hover:bg-agri-700 text-white font-semibold shadow-md gap-2 h-11 px-5">
            <Plus className="h-4 w-4" />
            <span>Build Multi-Farmer Bundle</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Member Smallholders"
          value={members.length || 342}
          subtitle="Enrolled in cooperative cluster"
          icon={Users}
          loading={membersLoading}
        />
        <KpiCard
          title="Matching Buyer Demands"
          value={demand.length}
          subtitle="Open procurement lot targets"
          icon={ShoppingBag}
          loading={demandLoading}
        />
        <KpiCard
          title="Active Aggregation Bundles"
          value="3 In Progress"
          subtitle="Multi-farmer lots assembled"
          icon={Layers}
        />
        <KpiCard
          title="Settled Cooperative Sales"
          value={formatCurrency(1850000)}
          subtitle="Direct farmer realizations"
          icon={ReceiptText}
        />
      </div>

      {/* Demand Preview & Bundle Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Demand */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Open Buyer Procurement Demand
            </CardTitle>
            <Link to="/fpo/demand">
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {demand.slice(0, 3).map((req) => (
              <div key={req.id} className="p-3.5 rounded-lg border border-border bg-surface-muted/30 space-y-1">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-foreground">{req.cropName}</div>
                  <span className="text-xs font-bold text-primary">₹{req.maxPricePerKg}/kg</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Buyer: {req.buyerName}</span>
                  <span>Target: {formatQuantity(req.quantityKg)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Multi-farmer Aggregation Shortcut */}
        <Card className="bg-agri-50/40 border-primary/20 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Why Aggregate Smallholder Lots?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Smallholders with 500kg or 1 tonne lots often face logistics barriers accessing high-value corporate buyers.
            </p>
            <p>
              The <strong>Kisan Setu FPO Bundle Builder</strong> enables the cooperative to aggregate 3 to 10 member lots into a single 25+ tonne shipment, guaranteeing fair price realization and shared transport efficiency.
            </p>

            <div className="pt-2">
              <Link to="/fpo/bundle">
                <Button className="w-full bg-primary hover:bg-agri-700 text-white font-semibold shadow-md">
                  Launch Bundle Builder
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
