import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionRow } from '../../components/cards/TransactionRow';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Download, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

export function AdminTransactions() {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');

  const { data, isLoading } = useTransactions();
  const transactions = data?.transactions || [];

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus = statusTab === 'ALL' || t.status === statusTab;
    const matchesSearch =
      !search ||
      t.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.cropName?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleExport = () => {
    toast.success('Complete Transactions Ledger (CSV) downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Transactions Ledger & Audit</h2>
          <p className="text-xs text-muted-foreground">
            Complete transaction lifecycle tracking • Government of Maharashtra Agri-Stack compliant audit log
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by ID, farmer, or buyer..."
          />
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
        <TabsList className="bg-surface-muted border border-border flex flex-wrap h-auto p-1">
          <TabsTrigger value="ALL" className="text-xs font-semibold">All Records</TabsTrigger>
          <TabsTrigger value="REQUESTED" className="text-xs">Requested</TabsTrigger>
          <TabsTrigger value="ACCEPTED" className="text-xs">Accepted</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS" className="text-xs">In Progress</TabsTrigger>
          <TabsTrigger value="COMPLETED" className="text-xs">Completed</TabsTrigger>
          <TabsTrigger value="REJECTED" className="text-xs">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED" className="text-xs">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {isLoading ? (
        <TableLoadingSkeleton rows={6} cols={8} />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No Transactions Found"
          description="No transactions matched your selected filters or search."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead className="w-32">ID</TableHead>
              <TableHead>Farmer Supplier</TableHead>
              <TableHead>Procuring Buyer</TableHead>
              <TableHead>Crop & Volume</TableHead>
              <TableHead>Agreed Value</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead className="text-right">Audit</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((txn) => (
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
      )}
    </div>
  );
}
