import { Plus } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { ConsultaPDFReport } from "@/components/Consultas/ConsultaPDFReport";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { NewGoalDialog } from "@/components/Consultas/NewGoalDialog";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { ConsultaTypeTabsContainer } from "@/components/Results/charts";
import { GoalProgressCard } from "@/components/Results/GoalProgressCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

const ConsultaResultsTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{
    customerId: string;
    consultaId: string;
  }>();
  const { dbUid } = useAuth();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);
  const customer = useGetCustomerData(customerId);

  // Fetch goals
  const { data: goals } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Find active goal
  const activeGoal = goals?.find((g) => {
    const now = new Date();
    const endDate = g.endDate
      ? new Date(g.endDate.split("/").reverse().join("-"))
      : null;
    return endDate && endDate > now;
  });

  if (!consulta) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Metas e Resultados</h3>
        <div className="flex gap-2">
          {consulta && (
            <ConsultaPDFReport consulta={consulta} customer={customer} />
          )}
          <NewGoalDialog
            consulta={
              consulta
                ? {
                    id: consulta.id || "",
                    results: consulta.results,
                    peso: consulta.peso,
                  }
                : undefined
            }
          >
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </NewGoalDialog>
        </div>
      </div>

      <Separator />

      {/* Active Goal Progress Card */}
      {activeGoal && customerId && dbUid && (
        <GoalProgressCard
          customerId={customerId}
          userId={dbUid}
          currentConsultaResults={consulta.results}
          currentConsulta={{
            id: consulta.id || "",
            results: consulta.results,
            peso: consulta.peso,
          }}
        />
      )}

      {/* Results Content - Smart Container */}
      {customerId && (
        <ConsultaTypeTabsContainer
          customerId={customerId}
          currentConsulta={consulta}
        />
      )}
    </div>
  );
};

export default ConsultaResultsTab;
