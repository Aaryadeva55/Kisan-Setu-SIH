import { useState } from 'react';
import { useLatestMarketPrices, useMarketPriceHistory } from '../../hooks/useMarketPrices';
import { PriceTrendChart } from '../../components/charts/PriceTrendChart';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { TrendingUp, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function AdminMarketPrices() {
  const [selectedCrop, setSelectedCrop] = useState('crop_soy');
  const { data: latestData, isLoading: latestLoading } = useLatestMarketPrices();
  const { data: historyData } = useMarketPriceHistory(selectedCrop);

  const prices = latestData?.prices || [];
  const history = historyData?.history || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">APMC Mandi Real-Time Prices</h2>
          <p className="text-xs text-muted-foreground">
            Direct feed from Maharashtra APMC Mandis (Lasalgaon, Pimpalgaon, Baramati, Sangamner)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Historical Trend:</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="crop_soy">Soybean (Pimpalgaon)</option>
            <option value="crop_oni">Onion Red (Lasalgaon)</option>
            <option value="crop_tom">Tomato (Baramati)</option>
            <option value="crop_cot">Cotton (Sangamner)</option>
          </select>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Mandi Modal Price Realization (August 2026)</span>
            <span className="text-xs font-normal text-muted-foreground">Daily Agmarknet Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTrendChart data={history} />
        </CardContent>
      </Card>

      {/* Real-time Mandi Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Mandi Price Bulletin</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b bg-surface-muted/60">
                <TableHead>Mandi Market Yard</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Min Price (₹/Qtl)</TableHead>
                <TableHead>Max Price (₹/Qtl)</TableHead>
                <TableHead>Modal Benchmark</TableHead>
                <TableHead className="text-right">Reporting Date</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {prices.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{p.mandi}</span>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{p.crop}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">₹{p.minPrice}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">₹{p.maxPrice}</TableCell>
                  <TableCell className="font-bold text-primary text-sm font-mono">₹{p.modalPrice}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(p.date)}
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
