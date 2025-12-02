import { DollarSign, TrendingUp, AlertCircle, CreditCard } from "lucide-react";
import { subMonths } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IFinance } from "@/domain/entities";
import { useFetchAnalyticsCountersQuery, useFetchMonthlyTrendsQuery } from "@/app/state/features/analyticsSlice";
import { useAuth } from "@/infra/firebase";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancesStatsProps {
  finances: IFinance[];
}

export const FinancesStats = ({ finances }: FinancesStatsProps) => {
  const { dbUid } = useAuth();
  const { data: counters, isLoading: isLoadingCounters } = useFetchAnalyticsCountersQuery(dbUid || "", {
    skip: !dbUid,
  });
  const { data: monthlyTrends, isLoading: isLoadingTrends } = useFetchMonthlyTrendsQuery(
    { uid: dbUid || "", months: 2 },
    { skip: !dbUid }
  );
  // Use analytics data for main metrics
  const currentYear = new Date().getFullYear();
  const yearlyRevenue = counters?.totalRevenue || 0;
  const currentMonthRevenue = counters?.totalRevenueThisMonth || 0;
  const totalPendingBalance = counters?.outstandingBalance || 0;

  // Get last month revenue from monthly trends
  const now = new Date();
  const lastMonthKey = subMonths(now, 1).toISOString().slice(0, 7);
  const lastMonthData = monthlyTrends?.find(m => m.month === lastMonthKey);
  const lastMonthRevenue = lastMonthData?.revenue || 0;

  // Payment status (still calculated from finances prop as it's not in analytics)
  const paidFinances = finances.filter((f) => f.status === "paid");
  const partialFinances = finances.filter((f) => f.status === "partial");
  const pendingFinances = finances.filter((f) => f.status === "pending");

  // Current year finances (for display purposes)
  const currentYearFinances = finances.filter((f) => {
    try {
      const financeDate = f.createdAt ? new Date(f.createdAt) : null;
      return financeDate && financeDate.getFullYear() === currentYear;
    } catch {
      return false;
    }
  });

  // Payment rate
  const paymentRate =
    finances.length > 0
      ? ((paidFinances.length / finances.length) * 100)
      : 0;

  // Growth calculation
  const growth =
    lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : currentMonthRevenue > 0
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(yearlyRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {currentYearFinances.length} venda{currentYearFinances.length !== 1 ? "s" : ""} em {currentYear}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPendingBalance)}</div>
          <p className="text-xs text-muted-foreground">
            {pendingFinances.length + partialFinances.length} venda{(pendingFinances.length + partialFinances.length) !== 1 ? "s" : ""} pendente{(pendingFinances.length + partialFinances.length) !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {paidFinances.length} de {finances.length} venda{finances.length !== 1 ? "s" : ""} paga{paidFinances.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
