import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export function FunnelChart({ data = [] }) {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No funnel data available</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-surface p-3 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-foreground">{item.stage}</p>
          <p className="text-primary font-bold text-sm">{item.count.toLocaleString('en-IN')} Count</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#5B6B62', fontSize: 12, fontWeight: 500 }}
            width={160}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || '#1E6F4C'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
