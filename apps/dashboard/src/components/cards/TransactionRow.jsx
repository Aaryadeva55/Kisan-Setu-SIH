import { StatusBadge } from '../common/StatusBadge';
import { MatchScoreBadge } from '../common/MatchScoreBadge';
import { TableRow, TableCell } from '../ui/table';
import { formatCurrency, formatQuantity, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function TransactionRow({
  transaction,
  detailPathPrefix = '/admin/transactions',
  showFarmer = true,
  showBuyer = true,
}) {
  return (
    <TableRow className="group cursor-pointer hover:bg-agri-50/40">
      {/* Transaction ID */}
      <TableCell className="font-mono font-medium text-xs text-foreground">
        <Link to={`${detailPathPrefix}/${transaction.id}`} className="hover:text-primary underline-offset-2 hover:underline">
          {transaction.id}
        </Link>
      </TableCell>

      {/* Farmer Details */}
      {showFarmer && (
        <TableCell>
          <div className="font-medium text-foreground">{transaction.farmerName}</div>
          <div className="text-xs text-muted-foreground">{transaction.districtName}</div>
        </TableCell>
      )}

      {/* Buyer Details */}
      {showBuyer && (
        <TableCell>
          <div className="font-medium text-foreground">{transaction.buyerName}</div>
        </TableCell>
      )}

      {/* Crop & Quantity */}
      <TableCell>
        <div className="font-semibold text-foreground">{transaction.cropName}</div>
        <div className="text-xs text-muted-foreground">{formatQuantity(transaction.quantityKg)}</div>
      </TableCell>

      {/* Agreed Value */}
      <TableCell>
        <div className="font-semibold text-primary">₹{transaction.agreedPricePerKg}/kg</div>
        <div className="text-xs text-muted-foreground">{formatCurrency(transaction.totalAmount)}</div>
      </TableCell>

      {/* Match Score */}
      <TableCell>
        <MatchScoreBadge score={transaction.matchScore || 80} size="sm" showIcon={false} />
      </TableCell>

      {/* Status Badge */}
      <TableCell>
        <StatusBadge status={transaction.status} />
      </TableCell>

      {/* Date */}
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(transaction.requestedAt, 'dd MMM yyyy')}
      </TableCell>

      {/* Detail Link */}
      <TableCell className="text-right">
        <Link
          to={`${detailPathPrefix}/${transaction.id}`}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
