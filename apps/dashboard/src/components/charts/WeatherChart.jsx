import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function WeatherChart({ data = [] }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7DF" />
          <XAxis dataKey="date" tickLine={false} tick={{ fill: '#5B6B62', fontSize: 12 }} />
          <YAxis
            yAxisId="rainfall"
            orientation="left"
            tick={{ fill: '#2E7DAF', fontSize: 11 }}
            tickFormatter={(v) => `${v}mm`}
          />
          <YAxis
            yAxisId="temp"
            orientation="right"
            domain={[15, 45]}
            tick={{ fill: '#C9A227', fontSize: 11 }}
            tickFormatter={(v) => `${v}°C`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7DF', borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar yAxisId="rainfall" name="Rainfall (mm)" dataKey="rainfall" fill="#2E7DAF" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="temp" name="Temperature (°C)" dataKey="temp" fill="#C9A227" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
