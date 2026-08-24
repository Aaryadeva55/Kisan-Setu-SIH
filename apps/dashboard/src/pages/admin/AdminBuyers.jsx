import { useState } from 'react';
import { useBuyersList } from '../../hooks/useBuyerRequirements';
import { SearchInput } from '../../components/common/SearchInput';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { formatQuantity } from '../../lib/utils';

export function AdminBuyers() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBuyersList();
  const buyers = data?.buyers || [];

  const filteredBuyers = buyers.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      b.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Registered Institutional Buyers</h2>
          <p className="text-xs text-muted-foreground">
            Food processors, wholesale aggregators, and corporate mills procuring lots via Kisan Setu
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search buyers by name or district..."
        />
      </div>

      {isLoading ? (
        <TableLoadingSkeleton rows={4} cols={5} />
      ) : filteredBuyers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Buyers Found"
          description="No buyers matched your search criteria."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead>Buyer Entity</TableHead>
              <TableHead>Representative</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Primary Hub</TableHead>
              <TableHead>Active Demands</TableHead>
              <TableHead className="text-right">Total Procured</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredBuyers.map((buyer) => (
              <TableRow key={buyer.id} className="hover:bg-agri-50/40">
                <TableCell className="font-bold text-foreground">{buyer.name}</TableCell>
                <TableCell className="text-sm font-medium">{buyer.contactPerson}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{buyer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />
                    <span>{buyer.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{buyer.district}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {buyer.activeRequirementsCount} Active Lots
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">
                  {formatQuantity(buyer.totalProcuredKg)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
