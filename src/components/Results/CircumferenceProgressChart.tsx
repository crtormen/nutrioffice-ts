import { format, parse } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { IGoal } from "@/domain/entities";
import { MEASURES } from "@/domain/entities/consulta";

import { useFilteredChartData } from "./hooks/useFilteredChartData";

interface CircumferenceProgressChartProps {
  measureKey: string;
  goal?: IGoal;
  consultaType?: "online" | "in-person" | "all";
}

const chartConfig = {
  value: {
    label: "Circunferência (cm)",
    color: "hsl(var(--chart-1))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const CircumferenceProgressChart = ({
  measureKey,
  goal,
  consultaType = "online",
}: CircumferenceProgressChartProps) => {
  // Use filtered chart data to only show online consultas by default
  const rawChartData = useFilteredChartData(
    measureKey,
    consultaType,
    goal?.createdAt,
  );

  // Transform data to use "value" as the key for consistency
  const chartData = rawChartData?.map((item) => ({
    date: item.date,
    value: item[measureKey],
  }));

  // Get the label for this measure
  const measureInfo = MEASURES.find((m) => m.value === measureKey);
  const measureLabel = measureInfo?.label || measureKey;

  let endDate: string | undefined;
  let targetValue: number | undefined;

  if (goal && goal.params?.[measureKey]) {
    endDate = format(
      parse(goal.endDate!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy",
    );
    targetValue = goal.params[measureKey];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-sm text-muted-foreground">
        Sem dados de {measureLabel.toLowerCase()}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <LineChart
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="category"
          interval={"preserveStartEnd"}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickCount={6}
          domain={["dataMin - 2", "dataMax + 2"]}
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          label={{
            value: "cm",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12 },
          }}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={() => measureLabel} />}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-1))", r: 3 }}
          isAnimationActive={false}
        />
        {targetValue && (
          <ReferenceLine
            y={targetValue}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Meta: ${targetValue}cm`,
              position: "insideTopRight",
              fill: "hsl(var(--chart-2))",
              fontSize: 11,
            }}
          />
        )}
        {endDate && (
          <ReferenceLine
            x={endDate}
            stroke="hsl(var(--chart-3))"
            strokeDasharray="3 3"
            label={{
              value: "Data Meta",
              position: "top",
              fill: "hsl(var(--chart-3))",
              fontSize: 11,
            }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
};
