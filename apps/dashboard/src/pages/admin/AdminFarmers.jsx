import { useState } from 'react';
import { useFarmers } from '../../hooks/useFarmers';
import { SearchInput } from '../../components/common/SearchInput';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { FarmerCard } from '../../components/cards/FarmerCard';
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
import { Users, ChevronRight, MapPin, Phone, Sprout, Globe } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function AdminFarmers() {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  const { data, isLoading } = useFarmers();
  const farmers = data?.farmers || [];

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search) ||
      f.village.toLowerCase().includes(search.toLowerCase());

    const matchesDistrict = districtFilter === 'ALL' || f.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Registered Farmers Directory</h2>
          <p className="text-xs text-muted-foreground">
            Smallholders registered via WhatsApp • Read-only view for crop advisories and sell intent history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Districts</option>
            <option value="Nashik">Nashik</option>
            <option value="Pune">Pune</option>
            <option value="Ahmednagar">Ahmednagar</option>
            <option value="Solapur">Solapur</option>
          </select>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone, or village..."
          />
        </div>
      </div>

      {/* Desktop Table */}
      {isLoading ? (
        <TableLoadingSkeleton rows={5} cols={6} />
      ) : filteredFarmers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Farmers Found"
          description="No registered farmers match your active search or district filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setDistrictFilter('ALL');
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <tr className="border-b bg-surface-muted/60">
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Village & District</TableHead>
                  <TableHead>Land Holding</TableHead>
                  <TableHead>FPO Cooperative</TableHead>
                  <TableHead>Advisories</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id} className="hover:bg-agri-50/40">
                    <TableCell className="font-semibold text-foreground">
                      <Link to={`/admin/farmers/${farmer.id}`} className="hover:text-primary hover:underline">
                        {farmer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{farmer.phone}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">{farmer.village}</div>
                      <div className="text-muted-foreground">{farmer.district} ({farmer.taluka})</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{farmer.landSizeAcres} Acres</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{farmer.fpoName || 'Independent'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded">
                        <Sprout className="h-3 w-3" />
                        {farmer.advisoriesCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(farmer.lastActive, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/farmers/${farmer.id}`}>
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
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredFarmers.map((farmer) => (
              <FarmerCard key={farmer.id} farmer={farmer} detailBasePath="/admin/farmers" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
