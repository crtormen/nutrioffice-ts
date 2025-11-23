import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";

interface MetricsProgressChartProps {
  customerId: string;
  userId: string;
}

const chartConfig = {
  change: {
    label: "Mudança",
    color: "hsl(var(--chart-1))",
  },
  decrease: {
    label: "Redução",
    color: "hsl(var(--chart-2))",
  },
  increase: {
    label: "Aumento",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const metricLabels: Record<string, string> = {
  peso: "Peso (kg)",
  fat: "Gordura (%)",
  mg: "M. Gorda (kg)",
  mm: "M. Magra (kg)",
  dobras: "Dobras (mm)",
};

export const MetricsProgressChart = ({
  customerId,
  userId,
}: MetricsProgressChartProps) => {
  const { data: consultas = [] } = useFetchCustomerConsultasQuery({
    uid: userId,
    customerId,
  });

  if (consultas.length < 2) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Necessário pelo menos 2 consultas para comparação
      </div>
    );
  }

  const latestConsulta = consultas[consultas.length - 1];
  const firstConsulta = consultas[0];

  const chartData = Object.entries(metricLabels)
    .map(([key, label]) => {
      let latestValue: number | undefined;
      let firstValue: number | undefined;

      if (key === "peso") {
        latestValue = Number(latestConsulta.peso);
        firstValue = Number(firstConsulta.peso);
      } else if (latestConsulta.results && firstConsulta.results) {
        latestValue = latestConsulta.results[key as keyof typeof latestConsulta.results] as number;
        firstValue = firstConsulta.results[key as keyof typeof firstConsulta.results] as number;
      }

      if (latestValue === undefined || firstValue === undefined) return null;

      const change = latestValue - firstValue;
      const percentChange = ((change / firstValue) * 100).toFixed(1);

      return {
        metric: label,
        change: Number(change.toFixed(2)),
        percentChange: `${percentChange}%`,
        isNegative: change < 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Sem dados suficientes para comparação
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          bottom: 20,
          left: 100,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="metric" type="category" width={90} />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value, name, props) => {
            const percent = props.payload?.percentChange;
            return [`${value} (${percent})`, "Mudança"];
          }}
        />
        <Bar dataKey="change" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.isNegative
                  ? "hsl(var(--chart-2))"
                  : "hsl(var(--chart-3))"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};
