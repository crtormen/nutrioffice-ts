import { DollarSign } from "lucide-react";

import { ROUTES } from "@/app/router/routes";
import { useFetchAllFinancesQuery } from "@/app/state/features/financesSlice";
import { FinancesChart } from "@/components/Finances/FinancesChart";
import { FinancesStats } from "@/components/Finances/FinancesStats";
import { FinancesTable } from "@/components/Finances/FinancesTable";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase";

const FinancesPage = () => {
  const { dbUid } = useAuth();
  const { data: finances } = useFetchAllFinancesQuery(
    { uid: dbUid || "" },
    { skip: !dbUid },
  );

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Financeiro" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton={false} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie suas vendas e acompanhe seu faturamento
          </p>
        </div>
      </div>

      <Separator />

      <FinancesStats finances={finances || []} />

      <FinancesChart />

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Todas as Vendas</h3>
        <FinancesTable />
      </div>
    </div>
  );
};

export default FinancesPage;
