import React, { useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ComposedChart,
} from "recharts";
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

  return (
    <ResponsiveContainer width="96%" height={350}>
      <ComposedChart
        width={350}
        height={220}
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
        <Line
          type="monotone"
          data={chartData}
          dataKey={param}
          stroke="#6d120e"
          isAnimationActive={false}
        />
        {goal && (
          <Line
            dataKey={param}
            name="META"
            type="monotone"
            stroke="red"
            data={[{ date: endDate, [param]: goal.params![param] }]}
          />
        )}
        {goal && (
          <ReferenceLine x={endDate} stroke="green" strokeDasharray="3 1" />
        )}
        {goal && (
          <ReferenceLine
            y={goal.params![param]}
            stroke="green"
            name={param}
            strokeDasharray="3 1"
          />
        )}
        <Tooltip />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
