import React from "react";
import {
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSetChartData } from "./hooks/useSetChartData";
import { format, parse } from "date-fns";
import { IGoal } from "@/domain/entities";

interface resultsChartProps {
  param: string;
  goal?: IGoal;
}

export const ResultsChart = ({ param, goal }: resultsChartProps) => {
  const chartData = useSetChartData(param, goal?.createdAt);
  let endDate;

  if (goal) {
    endDate = format(
      parse(goal.endDate!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy"
    );
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
          stroke="var(--color-peso)"
          isAnimationActive={false}
        />
        {goal && (
          <Line
            dataKey={param}
            name="META"
            type="monotone"
            stroke="var(--color-META)"
            data={[{ date: endDate, [param]: goal.params![param] }]}
          />
        )}
        {goal && (
          <ReferenceLine x={endDate} stroke="hsl(var(--chart-3))" strokeDasharray="3 1" />
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
