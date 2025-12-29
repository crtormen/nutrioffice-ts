import { format, parse } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

import { useSetChartData } from "./hooks/useSetChartData";

interface WeightProgressAreaChartProps {
  goal?: IGoal;
}

const chartConfig = {
  peso: {
    label: "Peso (kg)",
    color: "hsl(var(--chart-1))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const WeightProgressAreaChart = ({
  goal,
}: WeightProgressAreaChartProps) => {
  const chartData = useSetChartData("peso", goal?.createdAt);
  let endDate: string | undefined;
  let targetWeight: number | undefined;

  if (goal) {
    endDate = format(
      parse(goal.endDate!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy",
    );
    targetWeight = goal.params?.peso || goal.params?.weight;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
        Sem dados de peso disponíveis
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <AreaChart
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <defs>
          <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--chart-1))"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--chart-1))"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" type="category" interval={"preserveStartEnd"} />
        <YAxis
          tickCount={10}
          domain={["dataMin - 5", "dataMax + 5"]}
          allowDecimals={false}
          label={{ value: "kg", angle: -90, position: "insideLeft" }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="peso"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#colorPeso)"
          isAnimationActive={false}
        />
        {targetWeight && (
          <ReferenceLine
            y={targetWeight}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Meta: ${targetWeight}kg`,
              position: "insideTopRight",
              fill: "hsl(var(--chart-2))",
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
            }}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
};
