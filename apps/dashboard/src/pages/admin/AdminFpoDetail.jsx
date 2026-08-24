import { useParams, Link } from 'react-router-dom';
import { useFposList, useFpoMembers, useFpoDemand } from '../../hooks/useFpo';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Layers, Users, MapPin, Phone, UserCheck } from 'lucide-react';
import { formatQuantity } from '../../lib/utils';

export function AdminFpoDetail() {
  const { id } = useParams();
  const { data: fpoListData } = useFposList();
  const { data: membersData } = useFpoMembers(id);
  const { data: demandData } = useFpoDemand(id);

  const fpos = fpoListData?.fpos || [];
  const fpo = fpos.find((f) => f.id === id) || fpos[0];
  const members = membersData?.farmers || [];
  const demand = demandData?.demand || [];

  if (!fpo) {
    return <div className="p-8 text-center text-sm text-muted-foreground">FPO not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          to="/admin/fpos"
          className="inline-flex items-center text-xs font-semibold text-primary hover:text-agri-700 mb-2 gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to FPO Directory
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-100 text-agri-800 font-bold border border-agri-200">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{fpo.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>{fpo.district}, Maharashtra</span>
                <span>•</span>
                <Phone className="h-3.5 w-3.5" />
                <span>{fpo.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border shadow-2xs">
              {fpo.memberCount} Registered Members
            </span>
          </div>
        </div>
      </div>

      {/* Member Smallholders Roster */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Cooperative Member Farmers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b bg-surface-muted/60">
                <TableHead>Farmer Name</TableHead>
                <TableHead>Village / Taluka</TableHead>
                <TableHead>Land Holding</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-semibold text-foreground">{m.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.village}, {m.taluka}</TableCell>
                  <TableCell className="text-xs font-medium">{m.landSizeAcres} Acres</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.phone}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/farmers/${m.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
