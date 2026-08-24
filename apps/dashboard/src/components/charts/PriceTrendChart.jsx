import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function PriceTrendChart({ data = [] }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7DF" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: '#E1E7DF' }}
            tick={{ fill: '#5B6B62', fontSize: 12 }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#5B6B62', fontSize: 11 }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            formatter={(value) => [`₹${value}/Qtl`, 'Modal Price']}
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7DF', borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            name="Modal Price (₹/Quintal)"
            dataKey="modalPrice"
            stroke="#C9A227"
            strokeWidth={2.5}
            dot={{ fill: '#C9A227', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
