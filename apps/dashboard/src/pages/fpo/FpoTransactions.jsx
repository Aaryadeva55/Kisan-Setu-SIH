import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionRow } from '../../components/cards/TransactionRow';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Table, TableBody, TableHead, TableHeader } from '../../components/ui/table';
import { ReceiptText } from 'lucide-react';

export function FpoTransactions() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useTransactions();
  const transactions = data?.transactions || [];

  const filteredTransactions = transactions.filter(
    (t) =>
      !search ||
      t.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.cropName?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Cooperative Transactions Ledger</h2>
          <p className="text-xs text-muted-foreground">
            Track member smallholder harvests, bundle orders, and digital settlement receipts
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, member, or crop..."
        />
      </div>

      {isLoading ? (
        <TableLoadingSkeleton rows={5} cols={7} />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No Cooperative Transactions Recorded"
          description="Build your first bundle transaction to begin tracking shipments and settlements."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead className="w-32">ID</TableHead>
              <TableHead>Member / Lot</TableHead>
              <TableHead>Procuring Buyer</TableHead>
              <TableHead>Commodity & Volume</TableHead>
              <TableHead>Lot Value</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
