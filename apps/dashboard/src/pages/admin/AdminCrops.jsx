import { useCrops } from '../../hooks/useCrops';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Droplets } from 'lucide-react';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CROP_METADATA = {
  Soybean: { hindiName: 'सोयाबीन', msp: 4892, water: 'Medium (450-700mm)' },
  Cotton: { hindiName: 'कापूस', msp: 7122, water: 'High (700-1200mm)' },
  Onion: { hindiName: 'कांदा', msp: 2450, water: 'Medium (350-550mm)' },
  Sugarcane: { hindiName: 'ऊस', msp: 3150, water: 'High (1500-2500mm)' },
  Tomato: { hindiName: 'टोमॅटो', msp: 1950, water: 'High (600-800mm)' },
  Wheat: { hindiName: 'गहू', msp: 2275, water: 'Medium (400-600mm)' },
  Pomegranate: { hindiName: 'डाळिंब', msp: 8500, water: 'Low (200-400mm)' },
  Gram: { hindiName: 'हरभरा', msp: 5440, water: 'Low (250-400mm)' },
};

function formatSeasonWindow(start, end) {
  if (!start || !end) return '—';
  return `${MONTH_NAMES[start] || start} - ${MONTH_NAMES[end] || end}`;
}

export function AdminCrops() {
  const { data, isLoading } = useCrops();
  const crops = Array.isArray(data?.crops) ? data.crops : Array.isArray(data) ? data : [];

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
        <Card>
          <CardContent className="p-0">
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
                {crops.map((crop) => {
                  const meta = CROP_METADATA[crop.name] || {};
                  const seasonsList = Array.isArray(crop.seasons) ? crop.seasons : [];
                  const seasonNames = seasonsList.map((s) => (typeof s === 'string' ? s : s.season || 'Annual'));

                  const primarySeason = seasonsList[0] || {};
                  const sowingWindow =
                    crop.sowingWindow || formatSeasonWindow(primarySeason.sowStart, primarySeason.sowEnd);
                  const harvestWindow =
                    crop.harvestWindow || formatSeasonWindow(primarySeason.harvestStart, primarySeason.harvestEnd);
                  const msp = crop.mspPrice || meta.msp || 3000;
                  const water =
                    crop.waterRequirement ||
                    meta.water ||
                    (crop.waterReq ? `${crop.waterReq.toLowerCase()} requirement` : 'Moderate');
                  const hindi = crop.hindiName || meta.hindiName || crop.name;

                  return (
                    <TableRow key={crop.id} className="hover:bg-agri-50/40">
                      <TableCell>
                        <div className="font-bold text-foreground">{crop.name}</div>
                        <div className="text-xs text-muted-foreground">{hindi}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{crop.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5 text-blue-500" />
                          <span className="capitalize">{water}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {seasonNames.map((sName, idx) => (
                            <span
                              key={`${sName}-${idx}`}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                            >
                              {sName}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{sowingWindow}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{harvestWindow}</TableCell>
                      <TableCell className="text-right font-bold text-primary text-sm font-mono">
                        ₹{msp.toLocaleString('en-IN')}/Qtl
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
