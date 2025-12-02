import { format, subMonths, startOfMonth, subYears } from "date-fns";
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchMonthlyTrendsQuery } from "@/app/state/features/analyticsSlice";
import { useAuth } from "@/infra/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export const ConsultasChart = () => {
  const { dbUid } = useAuth();
  const { data: monthlyTrends, isLoading } = useFetchMonthlyTrendsQuery(
    { uid: dbUid || "", months: 24 }, // Get last 24 months for year comparison
    { skip: !dbUid }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas por Mês</CardTitle>
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

  // Debug logging
  console.log("ConsultasChart - Monthly trends:", monthlyTrends);
  console.log("ConsultasChart - Looking for months:", months.map(m => m.monthKey));
  if (monthlyTrends && monthlyTrends.length > 0) {
    console.log("ConsultasChart - Available months in data:", monthlyTrends.map(m => m.month));
  }

  // Build chart data from analytics monthly rollups
  const chartData = months.map((month) => {
    const currentYearData = monthlyTrends?.find(m => m.month === month.monthKey);
    const lastYearData = monthlyTrends?.find(m => m.month === month.lastYearKey);

    console.log(`Month ${month.monthKey}:`, {
      found: !!currentYearData,
      consultas: currentYearData?.totalConsultations
    });

    return {
      month: month.label,
      "Ano Atual": currentYearData?.totalConsultations || 0,
      "Ano Passado": lastYearData?.totalConsultations || 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultas por Mês</CardTitle>
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="Ano Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Ano Passado"
              fill="hsl(var(--muted-foreground))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
