import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionRow } from '../../components/cards/TransactionRow';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from '../../components/ui/table';
import { ReceiptText } from 'lucide-react';

export function BuyerTransactions() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useTransactions({ q: debouncedSearch });
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Transactions Ledger</h2>
          <p className="text-xs text-muted-foreground">
            Complete history of accepted lots, logistics progress, and closed procurement settlements.
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by farmer name, crop, or ID..."
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableLoadingSkeleton rows={5} cols={6} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No Transactions Found"
          description="You haven't accepted any transaction requests matching this search."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead className="w-32">Transaction ID</TableHead>
              <TableHead>Farmer / Supplier</TableHead>
              <TableHead>Crop Lot & Qty</TableHead>
              <TableHead>Agreed Value</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                detailPathPrefix="/buyer/transactions"
                showFarmer={true}
                showBuyer={false}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
