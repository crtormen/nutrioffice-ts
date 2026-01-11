import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { classifyConsultas } from "@/lib/utils/consultaFilters";

import { InPersonConsultasCharts } from "./InPersonConsultasCharts";
import { OnlineConsultasCharts } from "./OnlineConsultasCharts";

interface ConsultaTypeTabsContainerProps {
  customerId: string;
  currentConsulta?: ICustomerConsulta;
}

export const ConsultaTypeTabsContainer = ({
  customerId,
  currentConsulta,
}: ConsultaTypeTabsContainerProps) => {
  const { dbUid } = useAuth();

  // Fetch all customer consultas
  const { data: consultas, isLoading } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Carregando consultas...</p>
      </div>
    );
  }

  if (!consultas || consultas.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          Nenhuma consulta encontrada para este cliente
        </p>
      </div>
    );
  }

  // Classify consultas by type
  const classification = classifyConsultas(consultas);

  // If not hybrid, show single view without tabs
  if (!classification.isHybrid) {
    if (classification.hasOnline) {
      return (
        <OnlineConsultasCharts
          consultas={classification.online}
          customerId={customerId}
          userId={dbUid || ""}
        />
      );
    }

    return (
      <InPersonConsultasCharts
        consultas={classification.inPerson}
        customerId={customerId}
        currentConsulta={currentConsulta}
      />
    );
  }

  // Hybrid customer - show 3 tabs
  return (
    <Tabs defaultValue="todos" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="presencial">
          Presencial ({classification.inPerson.length})
        </TabsTrigger>
        <TabsTrigger value="online">
          Online ({classification.online.length})
        </TabsTrigger>
        <TabsTrigger value="todos">
          Todos ({classification.all.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="presencial" className="mt-6">
        {classification.inPerson.length > 0 ? (
          <InPersonConsultasCharts
            consultas={classification.inPerson}
            customerId={customerId}
            currentConsulta={currentConsulta}
          />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">
              Nenhuma consulta presencial encontrada
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="online" className="mt-6">
        {classification.online.length > 0 ? (
          <OnlineConsultasCharts
            consultas={classification.online}
            customerId={customerId}
            userId={dbUid || ""}
          />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">
              Nenhuma consulta online encontrada
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="todos" className="mt-6">
        <div className="space-y-8">
          {/* Show both sections in combined view */}
          {classification.inPerson.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">Consultas Presenciais</h3>
              <InPersonConsultasCharts
                consultas={classification.inPerson}
                customerId={customerId}
                currentConsulta={currentConsulta}
              />
            </div>
          )}

          {classification.online.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">Consultas Online</h3>
              <OnlineConsultasCharts
                consultas={classification.online}
                customerId={customerId}
                userId={dbUid || ""}
              />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
