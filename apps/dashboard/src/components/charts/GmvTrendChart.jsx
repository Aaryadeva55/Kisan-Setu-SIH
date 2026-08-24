import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';

export function GmvTrendChart({ data = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-surface p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-muted-foreground">{label} 2026</p>
          <p className="text-primary font-bold text-sm">
            {formatCurrency(payload[0].value)} Closed GMV
          </p>
          {payload[1] && (
            <p className="text-muted-foreground">{payload[1].value} Transactions</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E6F4C" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#1E6F4C" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7DF" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={{ stroke: '#E1E7DF' }}
            tick={{ fill: '#5B6B62', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#5B6B62', fontSize: 11 }}
            tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="gmv"
            stroke="#1E6F4C"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gmvGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
