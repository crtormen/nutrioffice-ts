import { format, startOfMonth, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFetchMonthlyTrendsQuery } from "@/app/state/features/analyticsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/infra/firebase";

export const FinancesChart = () => {
  const { dbUid } = useAuth();
  const { data: monthlyTrends, isLoading } = useFetchMonthlyTrendsQuery(
    { uid: dbUid || "", months: 24 }, // Get last 24 months for year comparison
    { skip: !dbUid },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Get last 12 months for current year
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = startOfMonth(subMonths(now, 11 - i));
    const lastYearDate = subYears(monthDate, 1);
    return {
      date: monthDate,
      label: format(monthDate, "MMM", { locale: ptBR }),
      monthKey: format(monthDate, "yyyy-MM"),
      lastYearKey: format(lastYearDate, "yyyy-MM"),
    };
  });

  // Build chart data from analytics monthly rollups
  const chartData = months.map((month) => {
    const currentYearData = monthlyTrends?.find(
      (m) => m.month === month.monthKey,
    );
    const lastYearData = monthlyTrends?.find(
      (m) => m.month === month.lastYearKey,
    );

    return {
      month: month.label,
      "Ano Atual": currentYearData?.revenue || 0,
      "Ano Passado": lastYearData?.revenue || 0,
    };
  });

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg border bg-background p-3 shadow-md"
          style={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <p className="mb-2 font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="Ano Atual"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Ano Passado"
              fill="hsl(var(--muted-foreground) / 0.5)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
