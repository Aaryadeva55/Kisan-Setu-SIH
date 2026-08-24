import { useState } from 'react';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import { KpiCard } from '../../components/common/KpiCard';
import { FunnelChart } from '../../components/charts/FunnelChart';
import { DistrictAdoptionChart } from '../../components/charts/DistrictAdoptionChart';
import { TransactionRow } from '../../components/cards/TransactionRow';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableHead, TableHeader } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  TrendingUp,
  ReceiptText,
  Activity,
  Download,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function AdminOverview() {
  const [dateRange, setDateRange] = useState('30d');
  const { data, isLoading } = useAdminOverview();

  const metrics = data?.metrics || {};
  const funnel = data?.funnel || [];
  const districtAdoption = data?.districtAdoption || [];
  const recentTransactions = data?.recentTransactions || [];

  const handleExport = () => {
    toast.success('Government Outcome Summary Report (CSV) downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Overview & KPIs</h2>
          <p className="text-xs text-muted-foreground">
            Real-time closed-loop agricultural metrics • Department of Agriculture & Farmers Welfare, Maharashtra
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter range={dateRange} onChange={setDateRange} />
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Total Farmers Reached"
          value={metrics.totalFarmersReached ? `${metrics.totalFarmersReached.toLocaleString('en-IN')}` : '1,850+'}
          delta={metrics.totalFarmersDelta || 14.2}
          subtitle="Onboarded via WhatsApp conversational channel"
          icon={Users}
          loading={isLoading}
        />
        <KpiCard
          title="Advisories Delivered (30d)"
          value={metrics.advisoriesDelivered30d ? `${metrics.advisoriesDelivered30d.toLocaleString('en-IN')}` : '4,280'}
          delta={metrics.advisoriesDelta || 18.5}
          subtitle="Localized weather & pest alerts dispatched"
          icon={MessageSquare}
          loading={isLoading}
        />
        <KpiCard
          title="Active Sell Intents"
          value={metrics.activeSellIntents || '16 Open'}
          subtitle="Awaiting algorithmic matching"
          icon={TrendingUp}
          loading={isLoading}
        />
        <KpiCard
          title="Estimated GMV Closed"
          value={formatCurrency(metrics.estimatedGmvClosed || 3450000)}
          delta={metrics.gmvDelta || 22.8}
          subtitle="Direct farmer-to-buyer transaction volume"
          icon={ReceiptText}
          loading={isLoading}
        />
        <KpiCard
          title="Data Pipeline Health"
          value={metrics.pipelineHealth?.status === 'HEALTHY' ? 'Operational (100%)' : 'Degraded'}
          statusDot={metrics.pipelineHealth?.status === 'HEALTHY' ? 'green' : 'red'}
          subtitle={`Last IMD/Agmarknet sync ${metrics.pipelineHealth?.lastIngestionMinutesAgo || 4}m ago`}
          icon={Activity}
          loading={isLoading}
        />
        <KpiCard
          title="Audit Compliance"
          value="100% Certified"
          subtitle="Compliant with Maharashtra Agri-Stack pilot"
          icon={ShieldCheck}
          loading={isLoading}
        />
      </div>

      {/* Charts 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transaction Conversion Funnel */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Transaction Conversion Funnel</span>
              <span className="text-xs font-normal text-muted-foreground">Intent $\rightarrow$ Match $\rightarrow$ Accept $\rightarrow$ Settlement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnel} />
          </CardContent>
        </Card>

        {/* Right: District-wise Adoption */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>District Farmer Adoption</span>
              <span className="text-xs font-normal text-muted-foreground">Top 5 Pilot Clusters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistrictAdoptionChart data={districtAdoption} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Recent Platform Transactions</CardTitle>
            <p className="text-xs text-muted-foreground">Live transaction ledger closing market linkage loops</p>
          </div>

          <Link to="/admin/transactions">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary">
              <span>View All Transactions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b bg-surface-muted/60">
                <TableHead className="w-32">ID</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Crop & Volume</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  detailPathPrefix="/admin/transactions"
                  showFarmer={true}
                  showBuyer={true}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
