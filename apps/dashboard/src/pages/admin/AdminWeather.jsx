import { useState } from 'react';
import { useWeather, useWeatherHistory } from '../../hooks/useWeather';
import { WeatherChart } from '../../components/charts/WeatherChart';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { CloudSun, Droplets, Thermometer, Wind, AlertCircle } from 'lucide-react';
import { SEED_DISTRICTS } from '../../mocks/seedData';

export function AdminWeather() {
  const [districtId, setDistrictId] = useState('dist_nsk');
  const { data: latestData } = useWeather(districtId);
  const { data: historyData } = useWeatherHistory(districtId);

  const weather = latestData || {};
  const history = historyData?.history || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">IMD Agro-Meteorological Intel</h2>
          <p className="text-xs text-muted-foreground">
            Automated weather ingestion feeds driving crop advisory rules & harvest risk calculations
          </p>
        </div>

        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SEED_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} District
            </option>
          ))}
        </select>
      </div>

      {/* Current Conditions Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-surface">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Thermometer className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Ambient Temperature</span>
              <div className="text-2xl font-bold text-foreground">{weather.temperatureC || 28.4}°C</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Relative Humidity</span>
              <div className="text-2xl font-bold text-foreground">{weather.humidityPercent || 78}%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
              <CloudSun className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">24h Cumulative Rainfall</span>
              <div className="text-2xl font-bold text-primary">{weather.rainfallMm || 12.4} mm</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advisory Forecast Alert */}
      {weather.forecast && (
        <div className="rounded-xl border border-primary/20 bg-agri-50/70 p-4 flex items-start gap-3 text-xs text-agri-900 leading-relaxed">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Agro-Advisory Advisory Dispatch Note: </span>
            <span>{weather.forecast}</span>
          </div>
        </div>
      )}

      {/* 7-Day Rainfall & Temperature History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">7-Day Observed Rainfall & Temperature Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <WeatherChart data={history} />
        </CardContent>
      </Card>
    </div>
  );
}
