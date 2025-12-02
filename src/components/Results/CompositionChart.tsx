import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useSetLastConsulta } from "./hooks/useSetLastConsulta";

const RADIAN = Math.PI / 180;

// Vibrant colors matching the design
const COLORS = {
  mg: "hsl(var(--chart-1))", // Blue for fat mass
  mm: "hsl(var(--chart-2))", // Teal for lean mass
  mr: "hsl(var(--chart-3))", // Orange for residual mass
  mo: "hsl(var(--chart-4))", // Coral for bone mass
};

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is significant enough
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={14}
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface CompositionChartProps {
  consulta?: {
    results?: {
      mg?: number;
      mm?: number;
      mr?: number;
      mo?: number;
    };
  };
}

const CompositionChart = ({ consulta: consultaProp }: CompositionChartProps = {}) => {
  const lastConsulta = useSetLastConsulta();
  const consulta = consultaProp || lastConsulta;

  if (!consulta || !consulta.results) return null;

  const data = [
    { name: "Massa Gorda", key: "mg", value: consulta.results.mg },
    { name: "Massa Magra", key: "mm", value: consulta.results.mm },
    { name: "Massa Residual", key: "mr", value: consulta.results.mr },
    { name: "Massa Óssea", key: "mo", value: consulta.results.mo },
  ].filter(item => item.value && item.value > 0); // Only show non-zero values

  return (
    <div className="w-full flex flex-col">
      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={90}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
            {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS[entry.key as keyof typeof COLORS] }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompositionChart;
