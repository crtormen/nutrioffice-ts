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
  // Don't filter by goal date - show all historical data
  const baseChartData = useSetChartData(param);

  // Handle empty data case early
  if (!baseChartData || baseChartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }

  let endDate: string | undefined;
  let startDate: string | undefined;
  let currentValue: number | undefined;
  let startValue: number | undefined;
  let goalValue: number | undefined;
  let goalStartValue: number | undefined;

  if (goal) {
    endDate = format(
      parse(goal.endDate!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy",
    );
    startDate = format(
      parse(goal.createdAt!, "dd/MM/yyyy", new Date()),
      "dd/MM/yy",
    );
    goalValue = goal.params![param];

    // Find the value at or just before goal creation date
    const goalStartDataPoint = baseChartData.find(point => point.date === startDate) ||
                               baseChartData[baseChartData.length - 1]; // Use last available if exact match not found
    goalStartValue = goalStartDataPoint?.[param] as number;
  }

  // Build enriched chart data with goal points
  let chartData = baseChartData;

  if (goal && baseChartData.length > 0) {
    const lastDataPoint = baseChartData[baseChartData.length - 1];

    // Use goalStartValue as the starting point value
    startValue = goalStartValue;

    // Get current value from last data point
    currentValue = lastDataPoint[param] as number;

    // Create enriched dataset with projection and goal points
    const enrichedData = baseChartData.map(point => {
      const enrichedPoint: any = { ...point };

      // Add start point marker at goal creation date
      if (point.date === startDate && startValue !== undefined) {
        enrichedPoint.startPoint = startValue;
      }

      // Add current point marker at last consultation
      if (point.date === lastDataPoint.date) {
        enrichedPoint.currentPoint = currentValue;
        enrichedPoint.projectionLine = currentValue;
      }

      return enrichedPoint;
    });

    // Add goal end date point if it doesn't already exist
    if (endDate && goalValue !== undefined && !enrichedData.some(d => d.date === endDate)) {
      enrichedData.push({
        date: endDate,
        [param]: undefined, // Don't show main line at goal date
        goalPoint: goalValue,
        projectionLine: goalValue,
      });
    } else if (endDate && goalValue !== undefined) {
      // If goal date already exists in data, add goal markers to it
      const goalDatePoint = enrichedData.find(d => d.date === endDate);
      if (goalDatePoint) {
        goalDatePoint.goalPoint = goalValue;
        goalDatePoint.projectionLine = goalValue;
      }
    }

    // Sort by date
    enrichedData.sort((a, b) => {
      const dateA = parse(a.date, "dd/MM/yy", new Date());
      const dateB = parse(b.date, "dd/MM/yy", new Date());
      return dateA.getTime() - dateB.getTime();
    });

    chartData = enrichedData;
  }

  const chartConfig = {
    [param]: {
      label: param,
      color: "hsl(var(--chart-1))",
    },
    startPoint: {
      label: "Inicial",
      color: "hsl(var(--chart-1))",
    },
    goalPoint: {
      label: "Meta",
      color: "hsl(var(--chart-2))",
    },
    currentPoint: {
      label: "Atual",
      color: "hsl(var(--chart-4))",
    },
    projectionLine: {
      label: "Projeção",
      color: "hsl(var(--chart-5))",
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
          tickFormatter={(value) => value.toFixed(1)}
        />
        <ChartTooltip
          content={<ChartTooltipContent
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(2);
              }
              return value;
            }}
          />}
        />

        {/* Main data line */}
        <Line
          type="monotone"
          dataKey={param}
          stroke={`var(--color-${param})`}
          strokeWidth={2}
          dot={{ fill: `var(--color-${param})`, r: 4 }}
          isAnimationActive={false}
          connectNulls={false}
        />

        {/* Projection line from current to goal */}
        {goal && (
          <Line
            type="monotone"
            dataKey="projectionLine"
            stroke="var(--color-projectionLine)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
        )}

        {/* Starting point marker */}
        {goal && (
          <Scatter
            dataKey="startPoint"
            fill="var(--color-startPoint)"
            shape="circle"
            r={5}
          />
        )}

        {/* Current point marker */}
        {goal && (
          <Scatter
            dataKey="currentPoint"
            fill="var(--color-currentPoint)"
            shape="circle"
            r={6}
          />
        )}

        {/* Goal point marker */}
        {goal && (
          <Scatter
            dataKey="goalPoint"
            fill="var(--color-goalPoint)"
            shape="circle"
            r={6}
          />
        )}

        {/* Reference lines */}
        {goal && endDate && (
          <ReferenceLine
            x={endDate}
            stroke="hsl(var(--chart-3))"
            strokeDasharray="3 1"
          />
        )}
        {goal && goalValue !== undefined && (
          <ReferenceLine
            y={goalValue}
            stroke="hsl(var(--chart-3))"
            strokeDasharray="3 1"
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
};
