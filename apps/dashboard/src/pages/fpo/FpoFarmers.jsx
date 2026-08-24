import { useState } from 'react';
import { useFpoMembers } from '../../hooks/useFpo';
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
import { Users, Phone, Sprout } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function FpoFarmers() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFpoMembers();
  const members = data?.farmers || [];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.village.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Cooperative Member Farmers</h2>
          <p className="text-xs text-muted-foreground">
            Roster of registered smallholder members enrolled in Godavari FPO
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search member farmers..."
        />
      </div>

      {isLoading ? (
        <TableLoadingSkeleton rows={5} cols={5} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Members Found"
          description="No member farmers match your search."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead>Farmer Name</TableHead>
              <TableHead>Village / Taluka</TableHead>
              <TableHead>Land Holding</TableHead>
              <TableHead>Contact Phone</TableHead>
              <TableHead>Advisories Received</TableHead>
              <TableHead className="text-right">Last WhatsApp Active</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((m) => (
              <TableRow key={m.id} className="hover:bg-agri-50/40">
                <TableCell className="font-bold text-foreground">{m.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.village}, {m.taluka}</TableCell>
                <TableCell className="text-xs font-semibold">{m.landSizeAcres} Acres</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.phone}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded border border-agri-200">
                    <Sprout className="h-3 w-3" />
                    {m.advisoriesCount || 0} Advisories
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatDate(m.lastActive)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
