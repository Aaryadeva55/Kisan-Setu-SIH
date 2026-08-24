import { useCrops } from '../../hooks/useCrops';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Sprout, Calendar, Droplets } from 'lucide-react';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function AdminCrops() {
  const { data, isLoading } = useCrops();
  const crops = data?.crops || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Crops & Sowing Calendar</h2>
        <p className="text-xs text-muted-foreground">
          Agricultural reference database for Maharashtra agro-climatic zones • Water requirements and MSP benchmarks
        </p>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton rows={5} cols={6} />
      ) : (
        <Table>
          <TableHeader>
            <tr className="border-b bg-surface-muted/60">
              <TableHead>Crop Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Water Needs</TableHead>
              <TableHead>Active Seasons</TableHead>
              <TableHead>Sowing Window</TableHead>
              <TableHead>Harvest Window</TableHead>
              <TableHead className="text-right">MSP Benchmark</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {crops.map((crop) => (
              <TableRow key={crop.id} className="hover:bg-agri-50/40">
                <TableCell>
                  <div className="font-bold text-foreground">{crop.name}</div>
                  <div className="text-xs text-muted-foreground">{crop.hindiName}</div>
                </TableCell>
                <TableCell className="text-xs font-medium">{crop.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                    <span>{crop.waterRequirement}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {crop.seasons.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{crop.sowingWindow}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{crop.harvestWindow}</TableCell>
                <TableCell className="text-right font-bold text-primary text-sm">
                  ₹{crop.mspPrice}/Qtl
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
