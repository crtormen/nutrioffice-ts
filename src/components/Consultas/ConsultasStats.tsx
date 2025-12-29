import { subMonths } from "date-fns";
import { Calendar, TrendingUp, Wifi, WifiOff } from "lucide-react";

import {
  useFetchAnalyticsCountersQuery,
  useFetchMonthlyTrendsQuery,
} from "@/app/state/features/analyticsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

interface ConsultasStatsProps {
  consultas: IConsulta[];
}

export const ConsultasStats = ({ consultas }: ConsultasStatsProps) => {
  const { dbUid } = useAuth();
  const { data: counters, isLoading: isLoadingCounters } =
    useFetchAnalyticsCountersQuery(dbUid || "", {
      skip: !dbUid,
    });
  const { data: monthlyTrends, isLoading: isLoadingTrends } =
    useFetchMonthlyTrendsQuery(
      { uid: dbUid || "", months: 2 },
      { skip: !dbUid },
    );

  // Use analytics data for main metrics
  const totalConsultas = counters?.totalConsultations || 0;
  const currentMonthConsultas = counters?.totalConsultationsThisMonth || 0;

  // Get last month consultas from monthly trends
  const now = new Date();
  const lastMonthKey = subMonths(now, 1).toISOString().slice(0, 7);
  const lastMonthData = monthlyTrends?.find((m) => m.month === lastMonthKey);
  const lastMonthConsultas = lastMonthData?.totalConsultations || 0;

  // Online vs Presential (still calculated from consultas prop as it's not in analytics)
  const onlineConsultas = consultas.filter((c) => c.online === true);
  const presentialConsultas = consultas.filter((c) => c.online === false);

  // Growth calculation
  const growth =
    lastMonthConsultas > 0
      ? ((currentMonthConsultas - lastMonthConsultas) / lastMonthConsultas) *
        100
      : currentMonthConsultas > 0
        ? 100
        : 0;

  // Show loading state while analytics data is loading
  if (isLoadingCounters || isLoadingTrends) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Consultas
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalConsultas}</div>
          <p className="text-xs text-muted-foreground">
            Todas as consultas registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mês Atual</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMonthConsultas}</div>
          <p className="text-xs text-muted-foreground">
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Consultas Online
          </CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onlineConsultas.length}</div>
          <p className="text-xs text-muted-foreground">
            {consultas.length > 0
              ? ((onlineConsultas.length / consultas.length) * 100).toFixed(1)
              : 0}
            % do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Consultas Presenciais
          </CardTitle>
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{presentialConsultas.length}</div>
          <p className="text-xs text-muted-foreground">
            {consultas.length > 0
              ? ((presentialConsultas.length / consultas.length) * 100).toFixed(
                  1,
                )
              : 0}
            % do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
