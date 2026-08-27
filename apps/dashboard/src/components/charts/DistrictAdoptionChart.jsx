import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export function DistrictAdoptionChart({ data = [] }) {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No adoption data available</div>;
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="district"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#17241E', fontSize: 12, fontWeight: 500 }}
            width={120}
          />
          <Tooltip
            formatter={(value, name) => [
              name === 'farmersCount' ? `${value} Farmers` : `₹${(value / 100000).toFixed(1)} Lakhs`,
              name === 'farmersCount' ? 'Registered Farmers' : 'GMV Realized',
            ]}
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7DF', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="farmersCount" name="farmersCount" fill="#1E6F4C" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
