import { format, parse } from "date-fns";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BodyCompositionBarChartProps {
  customerId: string;
  userId: string;
  limit?: number;
}

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

export const BodyCompositionBarChart = ({
  customerId,
  userId,
  limit = 6,
}: BodyCompositionBarChartProps) => {
  const { data: consultas = [] } = useFetchCustomerConsultasQuery({
    uid: userId,
    customerId,
  });

  const chartData = consultas
    .filter((c) => c.results && c.results.mg && c.results.mm && c.date)
    .slice(-limit)
    .map((consulta) => {
      let date;
      if (consulta.date) {
        try {
          date = parse(consulta.date, "dd/MM/yyyy", new Date());
        } catch {
          date = undefined;
        }
      }
      return {
        date: date && !isNaN(date.getTime()) ? format(date, "dd/MM/yy") : "-",
        mg: consulta.results?.mg || 0,
        mm: consulta.results?.mm || 0,
        mr: consulta.results?.mr || 0,
        mo: consulta.results?.mo || 0,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        Sem dados de composição corporal disponíveis
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: "kg", angle: -90, position: "insideLeft" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="mg"
          stackId="a"
          fill="var(--color-mg)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="mm"
          stackId="a"
          fill="var(--color-mm)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="mr"
          stackId="a"
          fill="var(--color-mr)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="mo"
          stackId="a"
          fill="var(--color-mo)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};
