import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import React from "react";

import { useFetchAnalyticsCountersQuery } from "@/app/state/features/analyticsSlice";
import { MetricCard } from "@/components/Dashboard/MetricCard";
import { OverduePaymentsCard } from "@/components/Dashboard/OverduePaymentsCard";
import { PendingSubmissionsCard } from "@/components/Dashboard/PendingSubmissionsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/infra/firebase/hooks";

const Dashboard = () => {
  const { dbUid } = useAuth();
  const { data: counters, isLoading } = useFetchAnalyticsCountersQuery(
    dbUid || "",
    {
      skip: !dbUid,
    },
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">
            Acompanhe aqui algumas informações importantes da sua clínica!
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Clientes"
            value={counters?.totalCustomers || 0}
            icon={Users}
            description="Clientes cadastrados"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <MetricCard
            title="Consultas (Mês)"
            value={counters?.totalConsultationsThisMonth || 0}
            icon={Calendar}
            description="Consultas realizadas este mês"
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(counters?.totalRevenue || 0)}
            icon={DollarSign}
            description="Receita total acumulada"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <MetricCard
            title="Saldo Pendente"
            value={formatCurrency(counters?.outstandingBalance || 0)}
            icon={TrendingUp}
            description="Valores a receber"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Overdue Payments List */}
        <OverduePaymentsCard />

        {/* Pending Submissions */}
        <PendingSubmissionsCard />
      </div>

      {/* Additional sections can be added here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Placeholder for future charts */}
      </div>
    </div>
  );
};

export default Dashboard;
