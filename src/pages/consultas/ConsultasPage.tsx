import { Calendar } from "lucide-react";

import { ROUTES } from "@/app/router/routes";
import { useFetchAllConsultasQuery } from "@/app/state/features/consultasSlice";
import { ConsultasChart } from "@/components/Consultas/ConsultasChart";
import { ConsultasStats } from "@/components/Consultas/ConsultasStats";
import { ConsultasTable } from "@/components/Consultas/ConsultasTable";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase";

const ConsultasPage = () => {
  const { dbUid } = useAuth();
  const { data: consultas } = useFetchAllConsultasQuery({ uid: dbUid });

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Consultas" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton={false} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Consultas</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie suas consultas e acompanhe estatísticas
          </p>
        </div>
      </div>

      <Separator />

      <ConsultasStats consultas={consultas || []} />

      <ConsultasChart />

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Todas as Consultas</h3>
        <ConsultasTable />
      </div>
    </div>
  );
};

export default ConsultasPage;
