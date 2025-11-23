import { PieChart, Pie } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSetLastConsulta } from "./hooks/useSetLastConsulta";

const RADIAN = Math.PI / 180;

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
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CompositionChart = () => {
  const consulta = useSetLastConsulta();
  if (!consulta || !consulta.results) return null;

  const data = [
    { name: "mg", value: consulta.results.mg, fill: "var(--color-mg)" },
    { name: "mm", value: consulta.results.mm, fill: "var(--color-mm)" },
    { name: "mr", value: consulta.results.mr, fill: "var(--color-mr)" },
    { name: "mo", value: consulta.results.mo, fill: "var(--color-mo)" },
  ];

  const chartConfig = {
    mg: {
      label: "Massa Gorda",
      color: "hsl(var(--chart-1))",
    },
    mm: {
      label: "Massa Magra",
      color: "hsl(var(--chart-2))",
    },
    mr: {
      label: "Massa Residual",
      color: "hsl(var(--chart-3))",
    },
    mo: {
      label: "Massa Óssea",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <PieChart>
        <Pie
          data={data}
          cy="50%"
          cx="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          dataKey="value"
          isAnimationActive={false}
        />
        <ChartLegend
          content={<ChartLegendContent />}
          verticalAlign="middle"
          className="flex-col items-start gap-2"
        />
      </PieChart>
    </ChartContainer>
  );
};

export default CompositionChart;
