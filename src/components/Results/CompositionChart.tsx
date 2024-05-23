import React from "react";
import { ResponsiveContainer, PieChart, Pie, Legend, Cell } from "recharts";
import { useSetLastConsulta } from "./hooks/useSetLastConsulta";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const RADIAN = Math.PI / 180;

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
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

const renderLegend = (value: string | undefined, entry: any) => {
  const { color } = entry;
  return <span style={{ color }}>{value}</span>;
};

const CompositionChart = () => {
  const consulta = useSetLastConsulta();
  if (!consulta || !consulta.results) return;

  const data = [
    { name: "Massa Gorda", value: consulta.results.mg },
    { name: "Massa Magra", value: consulta.results.mm },
    { name: "Massa Residual", value: consulta.results.mr },
    { name: "Massa Óssea", value: consulta.results.mo },
  ];

  return data ? (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cy="50%"
            cx="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="middle"
            align="left"
            layout="vertical"
            iconType="square"
            formatter={renderLegend}
            // wrapperStyle={{ padding: "0 0 10px 15px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  ) : null;
};

export default CompositionChart;
