import { format, parse } from "date-fns";
import React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
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

interface resultsChartProps {
  param: string;
  goal?: IGoal;
}

export const ResultsChart = ({ param, goal }: resultsChartProps) => {
  const chartData = useSetChartData(param, goal?.createdAt);
  let endDate;
  let currentDate;
  let currentValue;

  if (goal) {
    endDate = format(
      parse(goal.endDate!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy",
    );
  }

  // Get today's actual date and most recent value from consultas
  if (chartData && chartData.length > 0) {
    const today = format(new Date(), "dd/MM/yy");
    const lastDataPoint = chartData[chartData.length - 1];

    // Only show current point if it's different from the last data point date
    // This avoids duplicate points
    if (lastDataPoint.date !== today) {
      currentDate = today;
      currentValue = lastDataPoint[param];
    }
  }

  const chartConfig = {
    [param]: {
      label: param,
      color: "hsl(var(--chart-1))",
    },
    META: {
      label: "Meta",
      color: "hsl(var(--chart-2))",
    },
    ATUAL: {
      label: "Atual",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <ComposedChart
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="category"
          allowDuplicatedCategory={false}
          interval={"preserveStartEnd"}
        />
        <YAxis
          dataKey={param}
          tickCount={10}
          domain={["dataMin - 4", "dataMax + 4"]}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          data={chartData}
          dataKey={param}
          stroke={`var(--color-${param})`}
          strokeWidth={2}
          dot={{ fill: `var(--color-${param})`, r: 4 }}
          isAnimationActive={false}
        />
        {goal && (
          <Line
            dataKey={param}
            name="META"
            type="monotone"
            stroke="var(--color-META)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "var(--color-META)", r: 4 }}
            data={[{ date: endDate, [param]: goal.params![param] }]}
          />
        )}
        {/* Current value point - shown only when goal exists and we have data */}
        {goal && currentValue !== undefined && (
          <Scatter
            name="ATUAL"
            dataKey={param}
            data={[{ date: currentDate, [param]: currentValue }]}
            fill="var(--color-ATUAL)"
            shape="circle"
            r={6}
          />
        )}
        {goal && (
          <ReferenceLine
            x={endDate}
            stroke="hsl(var(--chart-3))"
            strokeDasharray="3 1"
          />
        )}
        {goal && (
          <ReferenceLine
            y={goal.params![param]}
            stroke="hsl(var(--chart-3))"
            name={param}
            strokeDasharray="3 1"
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
};
