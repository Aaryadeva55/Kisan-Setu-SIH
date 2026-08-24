import { useState } from 'react';
import { useFposList } from '../../hooks/useFpo';
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
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Layers, ChevronRight, MapPin, Users, Phone } from 'lucide-react';

export function AdminFpos() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFposList();
  const fpos = data?.fpos || [];

  const filteredFpos = fpos.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.district.toLowerCase().includes(search.toLowerCase()) ||
      f.presidentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Farmer Producer Organizations (FPOs)</h2>
          <p className="text-xs text-muted-foreground">
            Cooperative aggregation hubs bundling member smallholder harvests into institutional lots
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search FPOs by name or district..."
        />
      </div>

      {isLoading ? (
        <TableLoadingSkeleton rows={4} cols={5} />
      ) : filteredFpos.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No FPOs Found"
          description="No farmer producer organizations matched your search."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead>FPO Name</TableHead>
              <TableHead>District</TableHead>
              <TableHead>President / Contact</TableHead>
              <TableHead>Member Farmers</TableHead>
              <TableHead>Primary Focus Crops</TableHead>
              <TableHead>Active Bundles</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredFpos.map((fpo) => (
              <TableRow key={fpo.id} className="hover:bg-agri-50/40">
                <TableCell className="font-bold text-foreground">
                  <Link to={`/admin/fpos/${fpo.id}`} className="hover:text-primary hover:underline">
                    {fpo.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{fpo.district}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{fpo.presidentName}</div>
                  <div>{fpo.phone}</div>
                </TableCell>
                <TableCell className="text-xs font-semibold">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{fpo.memberCount} Members</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex flex-wrap gap-1">
                    {fpo.primaryCrops.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-surface-muted text-muted-foreground border text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    {fpo.activeBundles} Active
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/admin/fpos/${fpo.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
                      <span>View</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
